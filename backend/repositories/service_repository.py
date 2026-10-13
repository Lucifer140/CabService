"""
Rental Services Repository
"""
from repositories.base_repository import BaseRepository

class ServiceRepository(BaseRepository):
    @classmethod
    def list_all(cls, active_only: bool = False) -> list:
        alias_sql = "SELECT *, description AS short_desc, display_order AS sort_order FROM services"
        if active_only:
            sql = f"{alias_sql} WHERE is_active = 1 ORDER BY display_order ASC, id ASC;"
        else:
            sql = f"{alias_sql} ORDER BY display_order ASC, id ASC;"
        return cls.query(sql)

    @classmethod
    def get_by_id(cls, service_id: int) -> dict:
        return cls.query_one("SELECT *, description AS short_desc, display_order AS sort_order FROM services WHERE id = ?;", (service_id,))

    @classmethod
    def create(cls, data: dict):
        sql = """
            INSERT INTO services (title, slug, description, icon, image_url, is_active, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (
            data.get('title', ''),
            data.get('slug', ''),
            data.get('description', ''),
            data.get('icon', 'car'),
            data.get('image_url', ''),
            int(data.get('is_active', 1)),
            int(data.get('display_order', 0))
        ))

    @classmethod
    def update(cls, service_id: int, data: dict):
        sql = """
            UPDATE services
            SET title = ?, slug = ?, description = ?, icon = ?, image_url = ?,
                is_active = ?, display_order = ?, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (
            data.get('title', ''),
            data.get('slug', ''),
            data.get('description', ''),
            data.get('icon', 'car'),
            data.get('image_url', ''),
            int(data.get('is_active', 1)),
            int(data.get('display_order', 0)),
            service_id
        ))

    @classmethod
    def delete(cls, service_id: int):
        cls.execute("DELETE FROM services WHERE id = ?;", (service_id,))
