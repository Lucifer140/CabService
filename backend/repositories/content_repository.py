"""
Website CMS Content Repository
"""
import json
from repositories.base_repository import BaseRepository

class ContentRepository(BaseRepository):
    @classmethod
    def get_all(cls) -> dict:
        rows = cls.query("SELECT section_key, content_json, updated_by, updated_at FROM website_content;")
        result = {}
        for r in rows:
            try:
                result[r['section_key']] = json.loads(r['content_json'])
            except Exception:
                result[r['section_key']] = r['content_json']
        return result

    @classmethod
    def get_all_rows(cls) -> list:
        return cls.query("SELECT section_key, content_json, updated_by, updated_at FROM website_content ORDER BY section_key ASC;")

    @classmethod
    def get_by_section(cls, section_key: str):
        row = cls.query_one("SELECT content_json FROM website_content WHERE section_key = ?;", (section_key,))
        if not row:
            return None
        try:
            return json.loads(row['content_json'])
        except Exception:
            return row['content_json']

    @classmethod
    def update_block(cls, section_key: str, content: any, updated_by: str = 'Admin'):
        content_str = json.dumps(content) if isinstance(content, (dict, list)) else str(content)
        sql = """
            INSERT INTO website_content (section_key, content_json, updated_by, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(section_key) DO UPDATE SET
                content_json = excluded.content_json,
                updated_by = excluded.updated_by,
                updated_at = datetime('now');
        """
        cls.execute(sql, (section_key, content_str, updated_by))

    @classmethod
    def batch_update(cls, blocks: dict, updated_by: str = 'Admin'):
        for k, v in blocks.items():
            cls.update_block(k, v, updated_by)
