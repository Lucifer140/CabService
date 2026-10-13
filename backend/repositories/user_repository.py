"""
Admin User & Session Repository
"""
from __future__ import annotations
from typing import Optional, Any, Dict, List
from repositories.base_repository import BaseRepository

class UserRepository(BaseRepository):
    @classmethod
    def get_by_id(cls, admin_id: int) -> dict:
        sql = """
            SELECT id, username, full_name, phone, email, role, is_active,
                   failed_attempts, locked_until, last_login, created_at, updated_at
            FROM admins WHERE id = ?;
        """
        return cls.query_one(sql, (admin_id,))

    @classmethod
    def get_by_identifier(cls, identifier: str) -> dict:
        """Finds admin by username, phone number, or email."""
        clean = (identifier or '').strip()
        if not clean:
            return None
        sql = """
            SELECT * FROM admins
            WHERE LOWER(username) = LOWER(?) OR phone = ? OR LOWER(email) = LOWER(?);
        """
        return cls.query_one(sql, (clean, clean, clean))

    @classmethod
    def get_by_email(cls, email: str) -> dict:
        """Finds admin by email (case-insensitive)."""
        if not email:
            return None
        sql = "SELECT * FROM admins WHERE LOWER(TRIM(email)) = LOWER(TRIM(?));"
        return cls.query_one(sql, (email.strip(),))

    @classmethod
    def get_by_username(cls, username: str) -> dict:
        """Finds admin by username (case-insensitive)."""
        if not username:
            return None
        sql = "SELECT * FROM admins WHERE LOWER(TRIM(username)) = LOWER(TRIM(?));"
        return cls.query_one(sql, (username.strip(),))

    @classmethod
    def count_active_super_admins(cls) -> int:
        """Returns the number of active Super Admin accounts."""
        row = cls.query_one("SELECT COUNT(*) as count FROM admins WHERE role = 'SUPER_ADMIN' AND is_active = 1;")
        return row['count'] if row else 0

    @classmethod
    def count_users(cls) -> int:
        """Returns the total number of active admin users."""
        row = cls.query_one("SELECT COUNT(*) as count FROM admins WHERE is_active = 1;")
        return row['count'] if row else 0

    @classmethod
    def list_all(cls, search: Optional[str] = None, role: Optional[str] = None, status: Optional[str] = None) -> list:
        sql = """
            SELECT id, username, full_name, email, phone, role, is_active,
                   failed_attempts, last_login, created_at, updated_at
            FROM admins
            WHERE 1=1
        """
        params = []
        if search and search.strip():
            kw = f"%{search.strip().lower()}%"
            sql += " AND (LOWER(username) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)"
            params.extend([kw, kw, kw, kw])

        if role and role.strip() and role.strip().upper() != 'ALL':
            sql += " AND role = ?"
            params.append(role.strip().upper())

        if status and status.strip() and status.strip().lower() != 'all':
            s = status.strip().lower()
            if s in ('active', '1'):
                sql += " AND is_active = 1"
            elif s in ('deactivated', 'inactive', '0'):
                sql += " AND is_active = 0"

        sql += " ORDER BY id ASC;"
        return cls.query(sql, tuple(params))

    @classmethod
    def create(cls, username: str, password_hash: str, password_salt: str, full_name: str, phone: str, email: str, role: str) -> int:
        sql = """
            INSERT INTO admins (username, password_hash, password_salt, full_name, phone, email, role, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1);
        """
        return cls.execute(sql, (username.strip(), password_hash, password_salt, full_name.strip(), phone.strip(), email.strip().lower(), role.strip().upper()))

    @classmethod
    def update(cls, admin_id: int, full_name: str, phone: str, email: str, role: str, is_active: int):
        sql = """
            UPDATE admins
            SET full_name = ?, phone = ?, email = ?, role = ?, is_active = ?, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (full_name.strip(), phone.strip(), email.strip().lower(), role.strip().upper(), is_active, admin_id))

    @classmethod
    def update_password(cls, admin_id: int, password_hash: str, password_salt: str):
        sql = """
            UPDATE admins
            SET password_hash = ?, password_salt = ?, failed_attempts = 0, locked_until = NULL, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (password_hash, password_salt, admin_id))
        cls.revoke_all_sessions(admin_id)

    @classmethod
    def record_failed_attempt(cls, admin_id: int, failed_attempts: int, locked_until_str: Optional[str] = None):
        sql = """
            UPDATE admins
            SET failed_attempts = ?, locked_until = ?
            WHERE id = ?;
        """
        cls.execute(sql, (failed_attempts, locked_until_str, admin_id))

    @classmethod
    def reset_failed_attempts(cls, admin_id: int):
        sql = """
            UPDATE admins
            SET failed_attempts = 0, locked_until = NULL, last_login = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (admin_id,))

    @classmethod
    def delete(cls, admin_id: int):
        cls.revoke_all_sessions(admin_id)
        cls.execute("DELETE FROM admins WHERE id = ?;", (admin_id,))

    # Session Management
    @classmethod
    def create_session(cls, token: str, admin_id: int, ip_address: str, user_agent: str, expires_at: str):
        sql = """
            INSERT INTO sessions (token, admin_id, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?);
        """
        cls.execute(sql, (token, admin_id, ip_address, user_agent, expires_at))

    @classmethod
    def get_session_user(cls, token: str) -> dict:
        sql = """
            SELECT a.id, a.username, a.full_name, a.phone, a.email, a.role, a.is_active, s.expires_at
            FROM sessions s
            JOIN admins a ON s.admin_id = a.id
            WHERE s.token = ? AND s.expires_at > datetime('now') AND a.is_active = 1;
        """
        return cls.query_one(sql, (token,))

    @classmethod
    def delete_session(cls, token: str):
        cls.execute("DELETE FROM sessions WHERE token = ?;", (token,))

    @classmethod
    def revoke_all_sessions(cls, admin_id: int):
        """Immediately revokes all active session tokens for the specified administrator."""
        cls.execute("DELETE FROM sessions WHERE admin_id = ?;", (admin_id,))
