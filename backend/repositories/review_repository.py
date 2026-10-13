"""
Customer Reviews & Testimonials Repository
"""
from repositories.base_repository import BaseRepository

class ReviewRepository(BaseRepository):
    @classmethod
    def list_approved(cls, limit: int = 20) -> list:
        sql = """
            SELECT id, customer_name, rating, review_text, trip_ref, route, created_at
            FROM reviews
            WHERE is_approved = 1
            ORDER BY id DESC LIMIT ?;
        """
        return cls.query(sql, (limit,))

    @classmethod
    def list_all(cls, is_approved: int = None, limit: int = 100) -> list:
        if is_approved is not None:
            sql = """
                SELECT id, customer_name, customer_phone, rating, review_text, trip_ref, route, is_approved, created_at
                FROM reviews
                WHERE is_approved = ?
                ORDER BY id DESC LIMIT ?;
            """
            return cls.query(sql, (is_approved, limit))
        else:
            sql = """
                SELECT id, customer_name, customer_phone, rating, review_text, trip_ref, route, is_approved, created_at
                FROM reviews
                ORDER BY id DESC LIMIT ?;
            """
            return cls.query(sql, (limit,))

    @classmethod
    def get_stats(cls) -> dict:
        row = cls.query_one("""
            SELECT COUNT(*) as total_reviews,
                   ROUND(AVG(rating), 1) as avg_rating
            FROM reviews
            WHERE is_approved = 1;
        """)
        total = row['total_reviews'] if row and row['total_reviews'] else 0
        avg = float(row['avg_rating']) if row and row['avg_rating'] else 4.9

        # Rating breakdown (count of 5-star, 4-star, etc.)
        counts = {}
        for star in (5, 4, 3, 2, 1):
            s_row = cls.query_one("SELECT COUNT(*) as count FROM reviews WHERE is_approved = 1 AND rating = ?;", (star,))
            counts[str(star)] = s_row['count'] if s_row else 0

        return {
            "total_reviews": total,
            "average_rating": avg,
            "breakdown": counts
        }

    @classmethod
    def create(cls, data: dict) -> int:
        sql = """
            INSERT INTO reviews (
                customer_name, customer_phone, rating, review_text, trip_ref, route, is_approved
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
        """
        name = str(data.get('customer_name', '')).strip()
        phone = str(data.get('customer_phone', '')).strip()
        try:
            rating = max(1, min(5, int(data.get('rating', 5))))
        except (ValueError, TypeError):
            rating = 5

        text = str(data.get('review_text', '')).strip()
        trip_ref = str(data.get('trip_ref', '')).strip()
        route = str(data.get('route', 'Pune - Mumbai')).strip()
        is_approved = 1 if data.get('is_approved', 1) in (1, '1', True, 'true') else 0

        return cls.execute(sql, (name, phone, rating, text, trip_ref, route, is_approved))

    @classmethod
    def update_approval(cls, review_id: int, is_approved: int):
        sql = "UPDATE reviews SET is_approved = ?, updated_at = datetime('now') WHERE id = ?;"
        cls.execute(sql, (is_approved, review_id))

    @classmethod
    def delete(cls, review_id: int):
        sql = "DELETE FROM reviews WHERE id = ?;"
        cls.execute(sql, (review_id,))
