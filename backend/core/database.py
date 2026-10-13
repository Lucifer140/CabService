"""
Database Connection & Transaction Manager
"""
import sqlite3
from contextlib import contextmanager
from core.config import DB_FILE

def get_db():
    """Returns an active SQLite database connection with Row factory and FKs enabled."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def transaction():
    """Context manager for atomic database transactions with auto-rollback on error."""
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
