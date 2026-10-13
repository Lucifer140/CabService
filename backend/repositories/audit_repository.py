"""
Audit Log Repository
"""
from repositories.base_repository import BaseRepository

class AuditRepository(BaseRepository):
    @classmethod
    def log(cls, user_id: int, user_name: str, action: str, resource: str, details: str = '', ip_address: str = ''):
        try:
            sql = """
                INSERT INTO audit_logs (user_id, user_name, action, resource, details, ip_address)
                VALUES (?, ?, ?, ?, ?, ?);
            """
            cls.execute(sql, (user_id, user_name, action, resource, str(details), ip_address))
        except Exception as e:
            print(f"[!] Audit logging error: {e}")

    @classmethod
    def list_logs(cls, limit: int = 100) -> list:
        sql = """
            SELECT id, user_id, user_name, action, resource, details, ip_address, created_at
            FROM audit_logs
            ORDER BY id DESC LIMIT ?;
        """
        return cls.query(sql, (limit,))

    @classmethod
    def list_recent(cls, limit: int = 100) -> list:
        """Alias for list_logs."""
        return cls.list_logs(limit)
