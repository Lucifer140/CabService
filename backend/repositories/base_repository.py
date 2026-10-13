"""
Base Repository: Foundation for Data Access Layer
"""
from core.database import get_db

class BaseRepository:
    """Provides common database helper methods for all domain repositories."""

    @staticmethod
    def query(sql: str, params: tuple = ()) -> list:
        """Executes a SQL query and returns a list of dictionary rows."""
        conn = get_db()
        try:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            rows = [dict(row) for row in cursor.fetchall()]
            return rows
        finally:
            conn.close()

    @staticmethod
    def query_one(sql: str, params: tuple = ()) -> dict:
        """Executes a SQL query and returns a single dictionary row or None."""
        conn = get_db()
        try:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    @staticmethod
    def execute(sql: str, params: tuple = ()) -> int:
        """Executes an INSERT/UPDATE/DELETE query and returns lastrowid or affected rows."""
        conn = get_db()
        try:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()

    @staticmethod
    def execute_many(sql: str, param_list: list):
        """Executes a query for multiple parameter sets in a single transaction."""
        conn = get_db()
        try:
            cursor = conn.cursor()
            cursor.executemany(sql, param_list)
            conn.commit()
        finally:
            conn.close()
