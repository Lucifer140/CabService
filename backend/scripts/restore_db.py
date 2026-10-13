#!/usr/bin/env python3
"""
SQLite Database Restoration & Disaster Recovery Utility (Phase 40)
Safely restores a SQLite snapshot backup with pre-restoration safety snapshot,
integrity verification, schema sanity checking, and rollback capabilities.
"""
import os
import sys
import glob
import time
import shutil
import sqlite3
import argparse
from datetime import datetime, timezone

# Ensure backend root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from core.config import DB_FILE, DATA_DIR


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


def get_db_stats(db_path: str) -> dict:
    """Extracts summary statistics for verification."""
    stats = {"tables": 0, "counts": {}}
    try:
        with sqlite3.connect(db_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT count(*) FROM sqlite_master WHERE type='table';")
            stats["tables"] = cur.fetchone()[0]

            for table in ("users", "fleet", "tours", "services", "bookings", "settings"):
                try:
                    cur.execute(f"SELECT count(*) FROM {table};")
                    stats["counts"][table] = cur.fetchone()[0]
                except sqlite3.OperationalError:
                    stats["counts"][table] = None
    except Exception as e:
        stats["error"] = str(e)
    return stats


def restore_database(
    backup_file: str = None,
    target_db: str = None,
    verify_only: bool = False,
    force: bool = False
) -> dict:
    """
    Restores SQLite database from a backup file with safety snapshots.
    """
    dest_path = target_db or DB_FILE
    backup_dir = os.path.join(DATA_DIR, "backups")

    # 1. Locate backup file
    if not backup_file:
        candidates = sorted(glob.glob(os.path.join(backup_dir, "bookings_backup_*.db")))
        if not candidates:
            raise FileNotFoundError(f"No backups found in {backup_dir}")
        backup_file = candidates[-1]

    if not os.path.exists(backup_file):
        raise FileNotFoundError(f"Specified backup file not found: {backup_file}")

    print(f"[*] Selected backup file: {backup_file}")
    file_size_kb = round(os.path.getsize(backup_file) / 1024, 2)
    print(f"[*] Backup size: {file_size_kb} KB")

    # 2. Verify backup integrity before doing anything
    print("[*] Validating backup integrity with PRAGMA integrity_check...")
    is_valid, msg = verify_integrity(backup_file)
    if not is_valid:
        raise RuntimeError(f"Backup file failed integrity check: {msg}")
    print("[✓] Backup integrity verified: OK")

    stats = get_db_stats(backup_file)
    print(f"[*] Backup contents: {stats['tables']} tables detected.")
    for table, count in stats["counts"].items():
        if count is not None:
            print(f"    - {table}: {count} row(s)")

    if verify_only:
        print("\n[✓] Verification mode complete: Backup file is healthy and ready for disaster recovery.")
        return {
            "success": True,
            "mode": "verify_only",
            "backup_file": backup_file,
            "stats": stats
        }

    # 3. Create safety backup of existing live database
    safety_backup = None
    if os.path.exists(dest_path):
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safety_backup = os.path.join(backup_dir, f"bookings_pre_restore_{ts}.db")
        print(f"[*] Creating pre-restoration safety snapshot of active database: {os.path.basename(safety_backup)}...")
        with sqlite3.connect(dest_path) as src_conn:
            with sqlite3.connect(safety_backup) as dst_conn:
                src_conn.backup(dst_conn, pages=250)
        print(f"[✓] Safety snapshot saved.")

    # 4. Perform atomic restore using SQLite backup API
    print(f"[*] Restoring into live target: {dest_path}...")
    start_time = time.time()
    with sqlite3.connect(backup_file) as src_conn:
        with sqlite3.connect(dest_path) as dst_conn:
            src_conn.backup(dst_conn, pages=250)
            dst_conn.execute("PRAGMA journal_mode=WAL;")

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # 5. Verify restored live database
    is_live_valid, live_msg = verify_integrity(dest_path)
    if not is_live_valid:
        # Emergency rollback if safety backup exists
        if safety_backup and os.path.exists(safety_backup):
            print(f"[!] Restored DB failed integrity check. Rolling back to safety snapshot...")
            shutil.copy2(safety_backup, dest_path)
        raise RuntimeError(f"Restored database failed integrity check: {live_msg}")

    live_stats = get_db_stats(dest_path)
    print(f"[✓] Restoration completed successfully in {elapsed_ms}ms!")
    print(f"[✓] Live database verified operational: {live_stats['tables']} tables.")

    return {
        "success": True,
        "restored_from": backup_file,
        "target_db": dest_path,
        "safety_backup": safety_backup,
        "elapsed_ms": elapsed_ms,
        "live_stats": live_stats,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def main():
    parser = argparse.ArgumentParser(description="Sangita Travels SQLite Database Restoration & Disaster Recovery Utility")
    parser.add_argument("--backup-file", default=None, help="Path to backup .db file (defaults to most recent)")
    parser.add_argument("--target-db", default=None, help="Target database path (defaults to config.DB_FILE)")
    parser.add_argument("--verify-only", action="store_true", help="Only verify backup integrity without restoring")
    parser.add_argument("--force", action="store_true", help="Force restoration without user prompt")
    args = parser.parse_args()

    if not args.verify_only and not args.force:
        confirm = input("[!] WARNING: This will overwrite the live database with backup data. Proceed? (y/N): ")
        if confirm.strip().lower() not in ("y", "yes"):
            print("Operation aborted by user.")
            sys.exit(0)

    try:
        result = restore_database(
            backup_file=args.backup_file,
            target_db=args.target_db,
            verify_only=args.verify_only,
            force=args.force
        )
        print("\n=== Restoration Drill Complete ===")
        print(f"Status: SUCCESS")
        sys.exit(0)
    except Exception as e:
        print(f"\n[FATAL] Database restoration failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
