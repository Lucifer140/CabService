"""
Media Library Repository
"""
from repositories.base_repository import BaseRepository

class MediaRepository(BaseRepository):
    @classmethod
    def list_all(cls, category: str = None) -> list:
        if category and category != 'ALL':
            sql = "SELECT * FROM media WHERE category = ? ORDER BY id DESC;"
            return cls.query(sql, (category,))
        return cls.query("SELECT * FROM media ORDER BY id DESC;")

    @classmethod
    def get_by_id(cls, media_id: int) -> dict:
        return cls.query_one("SELECT * FROM media WHERE id = ?;", (media_id,))

    @classmethod
    def create(cls, filename: str, original_name: str, web_path: str, mime_type: str, file_size: int, category: str, uploaded_by: str) -> int:
        sql = """
            INSERT INTO media (filename, original_name, file_path, mime_type, file_size, category, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (filename, original_name, web_path, mime_type, file_size, category, uploaded_by))

    @classmethod
    def delete(cls, media_id: int):
        cls.execute("DELETE FROM media WHERE id = ?;", (media_id,))
