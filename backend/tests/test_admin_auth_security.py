"""
Security & Regression Tests: Admin Authentication, User Management, and RBAC Safeguards
File: backend/tests/test_admin_auth_security.py
"""
import unittest
import sqlite3
import os
import sys
import tempfile
import json
from unittest.mock import MagicMock

# Add backend directory to sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import core.config
import core.database
from core.security import hash_password, verify_password, validate_password_strength, generate_session_token
from repositories.user_repository import UserRepository
from repositories.audit_repository import AuditRepository
from repositories.booking_repository import BookingRepository
from controllers.auth_controller import AuthController
from controllers.user_controller import UserController
from router import authenticate_user
from scripts.bootstrap_super_admin import bootstrap_super_admin, normalize_email

class TestAdminAuthSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._orig_config_db = core.config.DB_FILE
        cls._orig_database_db = core.database.DB_FILE
        cls.test_db_fd, cls.test_db_path = tempfile.mkstemp(suffix="_test_auth.db")
        os.close(cls.test_db_fd)
        core.config.DB_FILE = cls.test_db_path
        core.database.DB_FILE = cls.test_db_path

        # Initialize schema in isolated DB
        conn = sqlite3.connect(cls.test_db_path)
        with conn:
            conn.executescript("""
                CREATE TABLE admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(128) NOT NULL,
                    password_salt VARCHAR(64) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) DEFAULT '',
                    email VARCHAR(100) NOT NULL,
                    role VARCHAR(30) NOT NULL DEFAULT 'SUPER_ADMIN',
                    is_active INTEGER DEFAULT 1,
                    failed_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP NULL,
                    last_login TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE UNIQUE INDEX idx_admins_email_unique ON admins(email);

                CREATE TABLE sessions (
                    token VARCHAR(64) PRIMARY KEY,
                    admin_id INTEGER NOT NULL,
                    ip_address VARCHAR(45) DEFAULT '',
                    user_agent TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
                );

                CREATE TABLE audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NULL,
                    user_name VARCHAR(100) NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    resource VARCHAR(100) NOT NULL,
                    details TEXT DEFAULT '',
                    ip_address VARCHAR(45) DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_ref VARCHAR(30) UNIQUE NOT NULL,
                    customer_name VARCHAR(100) DEFAULT 'Guest',
                    customer_phone VARCHAR(20) NOT NULL,
                    customer_email VARCHAR(100) DEFAULT '',
                    trip_type VARCHAR(30) DEFAULT 'oneway',
                    pickup_location TEXT NOT NULL,
                    drop_location TEXT NOT NULL,
                    travel_date DATE NOT NULL,
                    travel_time VARCHAR(20) DEFAULT 'Flexible',
                    vehicle_key VARCHAR(30) NOT NULL,
                    vehicle_name VARCHAR(100) NOT NULL,
                    estimated_fare REAL DEFAULT 0.0,
                    final_amount REAL DEFAULT 0.0,
                    status VARCHAR(30) DEFAULT 'NEW',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE vehicles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    vehicle_key VARCHAR(30) UNIQUE NOT NULL,
                    name VARCHAR(50) NOT NULL,
                    is_active INTEGER DEFAULT 1
                );

                CREATE TABLE drivers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) UNIQUE NOT NULL,
                    status VARCHAR(30) DEFAULT 'available'
                );
            """)
        conn.close()

    @classmethod
    def tearDownClass(cls):
        core.config.DB_FILE = cls._orig_config_db
        core.database.DB_FILE = cls._orig_database_db
        try:
            if os.path.exists(cls.test_db_path):
                os.remove(cls.test_db_path)
        except OSError:
            pass

    def setUp(self):
        # Clean admins, sessions, and audit_logs tables before each test
        conn = sqlite3.connect(self.test_db_path)
        with conn:
            conn.execute("DELETE FROM sessions;")
            conn.execute("DELETE FROM admins;")
            conn.execute("DELETE FROM audit_logs;")
            conn.execute("DELETE FROM bookings;")
            conn.execute("DELETE FROM drivers;")
            conn.execute("DELETE FROM vehicles;")
        conn.close()

    def _mock_handler(self, body=None, token=None, path="/"):
        """Creates a mock HTTP handler with request body and headers."""
        handler = MagicMock()
        handler.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'TestClient/1.0',
            'Remote-Addr': '127.0.0.1'
        }
        handler.client_address = ('127.0.0.1', 54321)
        handler.path = path

        if token:
            handler.headers['Authorization'] = f'Bearer {token}'

        raw_body = json.dumps(body or {}).encode('utf-8')
        handler.headers['Content-Length'] = str(len(raw_body))
        handler.rfile.read.return_value = raw_body

        handler.send_response = MagicMock()
        handler.send_header = MagicMock()
        handler.end_headers = MagicMock()
        handler.wfile.write = MagicMock()
        return handler

    def _get_response_json(self, handler):
        """Extracts JSON sent via handler.wfile.write."""
        if handler.wfile.write.called:
            written_bytes = handler.wfile.write.call_args[0][0]
            return json.loads(written_bytes.decode('utf-8'))
        return {}

    # 1. Password Policy & Hashing Tests
    def test_password_policy_enforcement(self):
        valid, msg = validate_password_strength("Short1")
        self.assertFalse(valid)
        self.assertIn("at least 8 characters", msg)

        valid, msg = validate_password_strength("nouppercaseornumber")
        self.assertFalse(valid)
        self.assertIn("numeric digit", msg)

        valid, msg = validate_password_strength("1234567890")
        self.assertFalse(valid)
        self.assertIn("alphabetic letter", msg)

        valid, msg = validate_password_strength("SecureAdmin#2026")
        self.assertTrue(valid)

    def test_pbkdf2_password_hashing_and_verification(self):
        pwd = "ComplexPassword#123"
        pwd_hash, salt = hash_password(pwd)
        self.assertNotEqual(pwd, pwd_hash)
        self.assertEqual(len(salt), 32)
        self.assertTrue(verify_password(pwd, pwd_hash, salt))
        self.assertFalse(verify_password("WrongPassword#999", pwd_hash, salt))

    # 2. Login & Credential Verification Tests
    def test_login_success_with_email_and_username(self):
        pwd_hash, salt = hash_password("CorrectPass#2026")
        u_id = UserRepository.create(
            "shital_admin", pwd_hash, salt, "Shital Upadhye", "8261021008", "shitalupadhye2001@gmail.com", "SUPER_ADMIN"
        )

        # Login using email
        handler_email = self._mock_handler({'email': 'shitalupadhye2001@gmail.com', 'password': 'CorrectPass#2026'})
        AuthController.login(handler_email)
        res_email = self._get_response_json(handler_email)
        self.assertTrue(res_email.get('success'))
        self.assertEqual(res_email.get('user', {}).get('role'), 'SUPER_ADMIN')
        self.assertTrue(res_email.get('token'))

        # Login using username
        handler_user = self._mock_handler({'username': 'shital_admin', 'password': 'CorrectPass#2026'})
        AuthController.login(handler_user)
        res_user = self._get_response_json(handler_user)
        self.assertTrue(res_user.get('success'))
        self.assertEqual(res_user.get('user', {}).get('email'), 'shitalupadhye2001@gmail.com')

    def test_login_incorrect_credentials_rejected(self):
        pwd_hash, salt = hash_password("RealSecret#2026")
        UserRepository.create("test_user", pwd_hash, salt, "Test User", "9999999999", "test@sangitatravels.com", "STAFF")

        # Wrong password
        handler = self._mock_handler({'email': 'test@sangitatravels.com', 'password': 'WrongPassword#000'})
        AuthController.login(handler)
        res = self._get_response_json(handler)
        self.assertFalse(res.get('success', False))
        self.assertIn("Invalid", res.get('error', ''))

        # Non-existent user
        handler_unknown = self._mock_handler({'email': 'nonexistent@example.com', 'password': 'SomePassword#1'})
        AuthController.login(handler_unknown)
        res_unknown = self._get_response_json(handler_unknown)
        self.assertFalse(res_unknown.get('success', False))
        self.assertIn("Invalid", res_unknown.get('error', ''))

    def test_login_brute_force_lockout_after_5_failures(self):
        pwd_hash, salt = hash_password("ValidPassword#123")
        u_id = UserRepository.create("lockout_target", pwd_hash, salt, "Target", "9999999998", "target@test.com", "STAFF")

        # Fail 5 times
        for i in range(5):
            handler = self._mock_handler({'email': 'target@test.com', 'password': 'WrongPass#999'})
            AuthController.login(handler)

        user_after = UserRepository.get_by_id(u_id)
        self.assertGreaterEqual(user_after.get('failed_attempts', 0), 5)
        self.assertIsNotNone(user_after.get('locked_until'))

        # 6th attempt should be blocked due to active lock
        handler_locked = self._mock_handler({'email': 'target@test.com', 'password': 'ValidPassword#123'})
        AuthController.login(handler_locked)
        res_locked = self._get_response_json(handler_locked)
        self.assertIn("temporarily locked", res_locked.get('error', ''))

    # 3. Session & Logout Tests
    def test_logout_invalidates_session(self):
        pwd_hash, salt = hash_password("StrongPassword#2026")
        u_id = UserRepository.create("sess_user", pwd_hash, salt, "Sess User", "9999999997", "sess@test.com", "STAFF")

        handler_login = self._mock_handler({'username': 'sess_user', 'password': 'StrongPassword#2026'})
        AuthController.login(handler_login)
        token = self._get_response_json(handler_login)['token']

        # Verify active session
        self.assertIsNotNone(UserRepository.get_session_user(token))

        # Logout
        handler_logout = self._mock_handler(token=token)
        AuthController.logout(handler_logout)

        # Verify session is revoked
        self.assertIsNone(UserRepository.get_session_user(token))

    def test_deactivated_account_cannot_login_and_revokes_sessions(self):
        pwd_hash, salt = hash_password("Pass#12345678")
        u_id = UserRepository.create("deact_user", pwd_hash, salt, "Deact User", "9999999996", "deact@test.com", "STAFF")

        # Active login
        h_login = self._mock_handler({'email': 'deact@test.com', 'password': 'Pass#12345678'})
        AuthController.login(h_login)
        token = self._get_response_json(h_login)['token']
        self.assertIsNotNone(UserRepository.get_session_user(token))

        # Deactivate user
        UserRepository.update(u_id, "Deact User", "9999999996", "deact@test.com", "STAFF", 0)
        UserRepository.revoke_all_sessions(u_id)

        # Session should immediately fail
        self.assertIsNone(UserRepository.get_session_user(token))

        # Login attempt should fail with deactivation message
        h_login2 = self._mock_handler({'email': 'deact@test.com', 'password': 'Pass#12345678'})
        AuthController.login(h_login2)
        res2 = self._get_response_json(h_login2)
        self.assertIn("deactivated", res2.get('error', '').lower())

    # 4. RBAC & Privilege Escalation Tests
    def test_rbac_staff_cannot_access_super_admin_user_management(self):
        pwd_hash, salt = hash_password("StaffPass#2026")
        staff_id = UserRepository.create("staff_member", pwd_hash, salt, "Staff Member", "9999999995", "staff@test.com", "STAFF")
        token = generate_session_token()
        UserRepository.create_session(token, staff_id, "127.0.0.1", "TestClient", "2030-01-01 00:00:00")

        # Staff attempts to list users (requires SUPER_ADMIN)
        h = self._mock_handler(token=token, path="/api/users")
        ok, user = authenticate_user(h, 'SUPER_ADMIN')
        self.assertFalse(ok)
        res = self._get_response_json(h)
        self.assertIn("Super Admin role required", res.get('error', ''))

    def test_user_cannot_modify_own_role(self):
        pwd_hash, salt = hash_password("SuperPass#2026")
        admin_id = UserRepository.create("super1", pwd_hash, salt, "Super 1", "9999999994", "super1@test.com", "SUPER_ADMIN")
        current_user = UserRepository.get_by_id(admin_id)

        # Admin tries to change their own role to MANAGER
        h = self._mock_handler({'role': 'MANAGER', 'full_name': 'Super 1'}, path=f"/api/users/{admin_id}")
        UserController.update_user(h, admin_id, current_user)
        res = self._get_response_json(h)
        self.assertIn("cannot modify your own administrative role", res.get('error', '').lower())

    def test_cannot_deactivate_or_delete_last_super_admin(self):
        pwd_hash, salt = hash_password("LoneSuper#2026")
        super_id = UserRepository.create("lone_super", pwd_hash, salt, "Lone Super", "9999999993", "lone@test.com", "SUPER_ADMIN")
        current_user = UserRepository.get_by_id(super_id)

        # Attempt to delete own account
        h_del = self._mock_handler(path=f"/api/users/{super_id}")
        UserController.delete_user(h_del, super_id, current_user)
        res_del = self._get_response_json(h_del)
        self.assertIn("cannot delete your own account", res_del.get('error', '').lower())

        # Create another admin who tries to delete or deactivate the last Super Admin
        admin2_id = UserRepository.create("admin_two", pwd_hash, salt, "Admin Two", "9999999992", "admin2@test.com", "ADMIN")
        admin2_user = UserRepository.get_by_id(admin2_id)

        # Try to deactivate lone super admin
        h_deact = self._mock_handler({'is_active': 0, 'role': 'SUPER_ADMIN'}, path=f"/api/users/{super_id}")
        UserController.update_user(h_deact, super_id, admin2_user)
        res_deact = self._get_response_json(h_deact)
        self.assertIn("last active super admin", res_deact.get('error', '').lower())

    # 5. User Creation Validation & Duplicate Email Handling
    def test_user_creation_prevents_duplicate_email_or_username(self):
        pwd_hash, salt = hash_password("AdminPass#2026")
        super_id = UserRepository.create("main_super", pwd_hash, salt, "Main Super", "9999999991", "main@test.com", "SUPER_ADMIN")
        current_user = UserRepository.get_by_id(super_id)

        # Attempt duplicate email
        h_dup = self._mock_handler({
            'username': 'different_username',
            'password': 'StrongPassword#123',
            'full_name': 'Different Person',
            'email': 'main@test.com',
            'role': 'STAFF'
        })
        UserController.create_user(h_dup, current_user)
        res_dup = self._get_response_json(h_dup)
        self.assertIn("already in use", res_dup.get('error', '').lower())

        # Attempt duplicate username
        h_dup_user = self._mock_handler({
            'username': 'main_super',
            'password': 'StrongPassword#123',
            'full_name': 'Different Person',
            'email': 'brand_new_email@test.com',
            'role': 'STAFF'
        })
        UserController.create_user(h_dup_user, current_user)
        res_dup_user = self._get_response_json(h_dup_user)
        self.assertIn("already in use", res_dup_user.get('error', '').lower())

    # 6. Super Admin Bootstrap Idempotence & Validation Tests
    def test_super_admin_bootstrap_process(self):
        target_email = "shitalupadhye2001@gmail.com"
        os.environ['SUPER_ADMIN_PASSWORD'] = "SangitaSecure#2026"

        # 1st run: creates account
        code1 = bootstrap_super_admin(target_email, username="shital_super", full_name="Shital Upadhye")
        self.assertEqual(code1, 0)

        created = UserRepository.get_by_email(target_email)
        self.assertIsNotNone(created)
        self.assertEqual(created['role'], 'SUPER_ADMIN')
        self.assertEqual(created['is_active'], 1)
        self.assertTrue(verify_password("SangitaSecure#2026", created['password_hash'], created['password_salt']))

        # 2nd run: idempotent (does not duplicate or overwrite)
        code2 = bootstrap_super_admin(target_email)
        self.assertEqual(code2, 0)

        # 3rd run with --check
        code_check = bootstrap_super_admin(target_email, check_only=True)
        self.assertEqual(code_check, 0)

        del os.environ['SUPER_ADMIN_PASSWORD']

    # 7. Audit Trail Integrity Tests
    def test_audit_logs_recorded_without_passwords(self):
        pwd_hash, salt = hash_password("SuperPass#2026")
        super_id = UserRepository.create("auditor", pwd_hash, salt, "Auditor", "9999999990", "auditor@test.com", "SUPER_ADMIN")
        current_user = UserRepository.get_by_id(super_id)

        h = self._mock_handler({
            'username': 'new_staff_audit',
            'password': 'SecureStaffPassword#2026',
            'full_name': 'Audit Staff',
            'email': 'staff_audit@test.com',
            'role': 'STAFF'
        })
        UserController.create_user(h, current_user)

        logs = AuditRepository.list_recent(limit=5)
        self.assertGreater(len(logs), 0)
        latest = logs[0]
        self.assertEqual(latest['action'], 'CREATE_USER')
        # Check that no password or salt appears in audit details
        self.assertNotIn("SecureStaffPassword#2026", latest['details'])
        self.assertNotIn(pwd_hash, latest['details'])

if __name__ == '__main__':
    unittest.main()
