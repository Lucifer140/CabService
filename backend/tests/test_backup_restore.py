"""
Automated Disaster Recovery & Database Backup Tests (Phase 40)
Tests WAL-consistent online backup, SHA-256 tamper verification, retention rotation,
and safe atomic restoration with pre-restore safety snapshots.
"""
import os
import sys
import shutil
import sqlite3
import tempfile
import unittest

# Ensure backend root is on sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from scripts.backup_db import create_backup, compute_sha256, verify_integrity
from scripts.restore_db import restore_database, get_db_stats


class TestBackupRestoreSuite(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.src_db = os.path.join(self.temp_dir, "test_source.db")
        self.backup_dir = os.path.join(self.temp_dir, "backups")
        os.makedirs(self.backup_dir, exist_ok=True)

        # Seed sample SQLite database with tables and rows
        with sqlite3.connect(self.src_db) as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT);")
            conn.execute("CREATE TABLE fleet (id INTEGER PRIMARY KEY, vehicle_key TEXT, name TEXT);")
            conn.execute("CREATE TABLE bookings (id INTEGER PRIMARY KEY, customer_name TEXT, fare REAL);")
            conn.execute("INSERT INTO users (username, role) VALUES ('admin', 'SUPER_ADMIN');")
            conn.execute("INSERT INTO fleet (vehicle_key, name) VALUES ('dzire', 'Swift Dzire');")
            conn.execute("INSERT INTO bookings (customer_name, fare) VALUES ('Rahul Sharma', 2499.0);")
            conn.commit()

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_01_backup_creation_and_integrity(self):
        """Verify create_backup creates valid SQLite backup with passing integrity check."""
        res = create_backup(
            src_db=self.src_db,
            backup_dir=self.backup_dir,
            max_backups=5
        )
        self.assertTrue(res["success"])
        self.assertTrue(os.path.exists(res["backup_file"]))
        self.assertEqual(res["tables_count"], 3)
        self.assertTrue(len(res["sha256"]) == 64)

        # Direct SQLite verification
        is_valid, msg = verify_integrity(res["backup_file"])
        self.assertTrue(is_valid)
        self.assertEqual(msg, "ok")

    def test_02_sha256_verification(self):
        """Verify compute_sha256 produces exact match for file bytes."""
        res = create_backup(src_db=self.src_db, backup_dir=self.backup_dir)
        computed = compute_sha256(res["backup_file"])
        self.assertEqual(res["sha256"], computed)

    def test_03_retention_rotation(self):
        """Verify retention policy limits total preserved backup snapshots."""
        max_limit = 3
        created_files = []
        for i in range(5):
            r = create_backup(
                src_db=self.src_db,
                backup_dir=self.backup_dir,
                max_backups=max_limit
            )
            created_files.append(r["backup_file"])

        remaining_files = os.listdir(self.backup_dir)
        self.assertLessEqual(len(remaining_files), max_limit)

    def test_04_restore_execution(self):
        """Verify restore_database restores all schema tables and record rows accurately."""
        backup_res = create_backup(src_db=self.src_db, backup_dir=self.backup_dir)

        # Modify source database
        with sqlite3.connect(self.src_db) as conn:
            conn.execute("DELETE FROM bookings;")
            conn.commit()

        # Verify bookings table is now empty
        with sqlite3.connect(self.src_db) as conn:
            cur = conn.cursor()
            cur.execute("SELECT count(*) FROM bookings;")
            self.assertEqual(cur.fetchone()[0], 0)

        # Restore from backup
        restore_res = restore_database(
            backup_file=backup_res["backup_file"],
            target_db=self.src_db,
            force=True
        )
        self.assertTrue(restore_res["success"])

        # Verify restored state
        with sqlite3.connect(self.src_db) as conn:
            cur = conn.cursor()
            cur.execute("SELECT count(*) FROM bookings;")
            self.assertEqual(cur.fetchone()[0], 1)
            cur.execute("SELECT customer_name FROM bookings WHERE id=1;")
            self.assertEqual(cur.fetchone()[0], "Rahul Sharma")

    def test_05_verify_corrupted_backup_rejected(self):
        """Verify corrupted backup file is flagged by verify_integrity and rejected."""
        corrupted_file = os.path.join(self.backup_dir, "corrupted.db")
        with open(corrupted_file, "wb") as f:
            f.write(b"NOT A SQLITE DATABASE FILE GARBAGE DATA 1234567890")

        is_valid, msg = verify_integrity(corrupted_file)
        self.assertFalse(is_valid)

        with self.assertRaises(RuntimeError):
            restore_database(backup_file=corrupted_file, target_db=self.src_db, force=True)


if __name__ == "__main__":
    unittest.main()
