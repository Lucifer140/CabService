"""
Settings Repository
"""
from repositories.base_repository import BaseRepository

class SettingsRepository(BaseRepository):
    @classmethod
    def get_all(cls) -> dict:
        rows = cls.query("SELECT key, value FROM settings;")
        return {r['key']: r['value'] for r in rows}

    @classmethod
    def get_by_key(cls, key: str, default: str = None) -> str:
        row = cls.query_one("SELECT value FROM settings WHERE key = ?;", (key,))
        return row['value'] if row else default

    @classmethod
    def update(cls, key: str, value: str, category: str = 'business'):
        sql = """
            INSERT INTO settings (key, category, value)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = datetime('now');
        """
        cls.execute(sql, (key, category, value))

    @classmethod
    def batch_update(cls, settings_dict: dict):
        for k, v in settings_dict.items():
            cls.update(k, str(v))
