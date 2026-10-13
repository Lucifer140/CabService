#!/usr/bin/env python3
"""
Automated SQLite Database Backup Utility (Phase 40)
Performs WAL-consistent online snapshot backups with integrity verification,
checksum hashing, automated retention rotation, and optional cloud archive sync.
"""
import os
import sys
import glob
import time
import hashlib
import sqlite3
import argparse
from datetime import datetime, timezone

# Ensure backend root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from core.config import DB_FILE, DATA_DIR


def compute_sha256(filepath: str) -> str:
    """Computes SHA-256 hash of a file for tamper-proofing."""
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def verify_integrity(db_path: str) -> tuple[bool, str]:
    """Runs PRAGMA integrity_check on the target SQLite database."""
    try:
        with sqlite3.connect(db_path) as conn:
            cur = conn.cursor()
            cur.execute("PRAGMA integrity_check;")
            res = cur.fetchone()
            if res and res[0] == "ok":
                return True, "ok"
            return False, str(res[0]) if res else "Unknown integrity error"
    except Exception as e:
        return False, str(e)


def create_backup(
    src_db: str = None,
    backup_dir: str = None,
    max_backups: int = 30,
    cloud_cmd: str = None
) -> dict:
    """
    Creates an online, transactionally consistent SQLite backup.
    Returns a dict with backup execution details.
    """
    source_path = src_db or DB_FILE
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source database file not found: {source_path}")

    # Determine backup storage location
    target_dir = backup_dir or os.path.join(DATA_DIR, "backups")
    os.makedirs(target_dir, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    backup_filename = f"bookings_backup_{timestamp}.db"
    backup_filepath = os.path.join(target_dir, backup_filename)

    print(f"[*] Initiating WAL-consistent online backup: {os.path.basename(source_path)} -> {backup_filename}...")
    start_time = time.time()

    # 1. Open source and flush WAL buffer if possible
    with sqlite3.connect(source_path) as src_conn:
        try:
            src_conn.execute("PRAGMA wal_checkpoint(PASSIVE);")
        except sqlite3.OperationalError:
            pass

        # 2. Native SQLite streaming backup
        with sqlite3.connect(backup_filepath) as dst_conn:
            src_conn.backup(dst_conn, pages=250)
            try:
                dst_conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
                dst_conn.execute("PRAGMA journal_mode=DELETE;")
            except Exception:
                pass

    # Clean up transient sidecar files so backup is a single self-contained file
    for sidecar in [backup_filepath + "-wal", backup_filepath + "-shm"]:
        if os.path.exists(sidecar):
            try:
                os.remove(sidecar)
            except OSError:
                pass

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    file_size_kb = round(os.path.getsize(backup_filepath) / 1024, 2)
    sha256_hash = compute_sha256(backup_filepath)

    # 3. Verify backup integrity
    is_valid, integrity_msg = verify_integrity(backup_filepath)
    if not is_valid:
        os.remove(backup_filepath)
        raise RuntimeError(f"Backup failed integrity verification: {integrity_msg}")

    # 4. Count tables in backup
    with sqlite3.connect(backup_filepath) as conn:
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM sqlite_master WHERE type='table';")
        tables_count = cur.fetchone()[0]

    print(f"[✓] Backup created successfully: {backup_filename} ({file_size_kb} KB, {tables_count} tables, {elapsed_ms}ms)")
    print(f"    SHA-256: {sha256_hash}")

    # 5. Apply retention rotation
    existing_backups = sorted(glob.glob(os.path.join(target_dir, "bookings_backup_*.db")))
    removed_count = 0
    if len(existing_backups) > max_backups:
        to_remove = existing_backups[:-max_backups]
        for old_file in to_remove:
            try:
                os.remove(old_file)
                for ext in ["-wal", "-shm"]:
                    sidecar_old = old_file + ext
                    if os.path.exists(sidecar_old):
                        try:
                            os.remove(sidecar_old)
                        except OSError:
                            pass
                removed_count += 1
            except OSError as e:
                print(f"[!] Warning deleting old backup {old_file}: {e}")
        print(f"[*] Rotated retention: pruned {removed_count} older backup(s), preserving last {max_backups}.")

    # 6. Optional cloud sync execution
    sync_output = None
    cloud_sync = cloud_cmd or os.environ.get("BACKUP_SYNC_CMD")
    if cloud_sync:
        print(f"[*] Executing cloud archive sync: {cloud_sync}...")
        try:
            import subprocess
            cmd_formatted = cloud_sync.replace("{backup_file}", backup_filepath)
            proc = subprocess.run(cmd_formatted, shell=True, capture_output=True, text=True, timeout=60)
            sync_output = {
                "exit_code": proc.returncode,
                "stdout": proc.stdout.strip(),
                "stderr": proc.stderr.strip()
            }
            if proc.returncode == 0:
                print("[✓] Cloud sync completed successfully.")
            else:
                print(f"[!] Warning: Cloud sync exited with code {proc.returncode}: {proc.stderr}")
        except Exception as e:
            print(f"[!] Cloud sync error: {e}")
            sync_output = {"error": str(e)}

    return {
        "success": True,
        "backup_file": backup_filepath,
        "filename": backup_filename,
        "size_kb": file_size_kb,
        "tables_count": tables_count,
        "sha256": sha256_hash,
        "elapsed_ms": elapsed_ms,
        "retention_preserved": min(len(existing_backups), max_backups),
        "cloud_sync": sync_output,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def main():
    parser = argparse.ArgumentParser(description="Sangita Travels SQLite Database Backup Utility")
    parser.add_argument("--db", default=None, help="Source database path (defaults to config.DB_FILE)")
    parser.add_argument("--target-dir", default=None, help="Backup directory (defaults to data/backups)")
    parser.add_argument("--max-backups", type=int, default=30, help="Maximum snapshots to retain (default: 30)")
    parser.add_argument("--cloud-cmd", default=None, help="Optional command for cloud sync, e.g. 'aws s3 cp {backup_file} s3://bucket/'")
    args = parser.parse_args()

    try:
        result = create_backup(
            src_db=args.db,
            backup_dir=args.target_dir,
            max_backups=args.max_backups,
            cloud_cmd=args.cloud_cmd
        )
        print("\n=== Backup Operation Complete ===")
        print(f"File: {result['backup_file']}")
        print(f"Size: {result['size_kb']} KB")
        print(f"Integrity: VERIFIED OK")
        sys.exit(0)
    except Exception as e:
        print(f"\n[FATAL] Database backup failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
