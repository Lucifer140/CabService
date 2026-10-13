"""
Tour Packages Repository
"""
from repositories.base_repository import BaseRepository

class TourRepository(BaseRepository):
    @classmethod
    def list_all(cls, active_only: bool = False) -> list:
        alias_fields = """
            *,
            price AS starting_price,
            itinerary AS description,
            cover_image AS image_url,
            is_published AS is_active,
            display_order AS sort_order
        """
        if active_only:
            sql = f"SELECT {alias_fields} FROM tours WHERE is_published = 1 ORDER BY display_order ASC, id ASC;"
        else:
            sql = f"SELECT {alias_fields} FROM tours ORDER BY display_order ASC, id ASC;"
        return cls.query(sql)

    @classmethod
    def get_by_id(cls, tour_id: int) -> dict:
        return cls.query_one("""
            SELECT *,
                   price AS starting_price,
                   itinerary AS description,
                   cover_image AS image_url,
                   is_published AS is_active,
                   display_order AS sort_order
            FROM tours WHERE id = ?;
        """, (tour_id,))

    @classmethod
    def get_by_slug(cls, slug: str) -> dict:
        return cls.query_one("""
            SELECT *,
                   price AS starting_price,
                   itinerary AS description,
                   cover_image AS image_url,
                   is_published AS is_active,
                   display_order AS sort_order
            FROM tours WHERE slug = ?;
        """, (slug,))


    @classmethod
    def create(cls, data: dict):
        sql = """
            INSERT INTO tours (
                title, slug, destination, duration, itinerary,
                inclusions, exclusions, price, cover_image, is_published, display_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (
            data.get('title', ''),
            data.get('slug', ''),
            data.get('destination', ''),
            data.get('duration', '1 Day'),
            data.get('itinerary', ''),
            data.get('inclusions', ''),
            data.get('exclusions', ''),
            float(data.get('price')) if data.get('price') is not None else None,
            data.get('cover_image', ''),
            int(data.get('is_published', 1)),
            int(data.get('display_order', 0))
        ))

    @classmethod
    def update(cls, tour_id: int, data: dict):
        sql = """
            UPDATE tours
            SET title = ?, slug = ?, destination = ?, duration = ?, itinerary = ?,
                inclusions = ?, exclusions = ?, price = ?, cover_image = ?,
                is_published = ?, display_order = ?, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (
            data.get('title', ''),
            data.get('slug', ''),
            data.get('destination', ''),
            data.get('duration', '1 Day'),
            data.get('itinerary', ''),
            data.get('inclusions', ''),
            data.get('exclusions', ''),
            float(data.get('price')) if data.get('price') is not None else None,
            data.get('cover_image', ''),
            int(data.get('is_published', 1)),
            int(data.get('display_order', 0)),
            tour_id
        ))

    @classmethod
    def delete(cls, tour_id: int):
        cls.execute("DELETE FROM tours WHERE id = ?;", (tour_id,))
