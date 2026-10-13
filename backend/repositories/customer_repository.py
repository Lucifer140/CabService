"""
Customer CRM Repository
"""
from repositories.base_repository import BaseRepository

class CustomerRepository(BaseRepository):
    @classmethod
    def get_by_id(cls, customer_id: int) -> dict:
        return cls.query_one("SELECT * FROM customers WHERE id = ?;", (customer_id,))

    @classmethod
    def get_by_phone(cls, phone: str) -> dict:
        return cls.query_one("SELECT * FROM customers WHERE phone = ?;", (phone,))

    @classmethod
    def get_or_create(cls, name: str, phone: str, email: str = '', preferred_vehicle: str = '') -> int:
        clean_phone = phone.strip().replace(' ', '').replace('-', '')
        existing = cls.get_by_phone(clean_phone)
        if existing:
            # Update name/email if empty
            update_sql = """
                UPDATE customers
                SET name = COALESCE(NULLIF(name, ''), ?),
                    email = COALESCE(NULLIF(email, ''), ?),
                    preferred_vehicle = COALESCE(NULLIF(preferred_vehicle, ''), ?),
                    total_bookings = total_bookings + 1,
                    last_trip = CURRENT_DATE,
                    updated_at = datetime('now')
                WHERE id = ?;
            """
            cls.execute(update_sql, (name, email, preferred_vehicle, existing['id']))
            return existing['id']
        else:
            insert_sql = """
                INSERT INTO customers (name, phone, email, preferred_vehicle, total_bookings, last_trip)
                VALUES (?, ?, ?, ?, 1, CURRENT_DATE);
            """
            return cls.execute(insert_sql, (name, clean_phone, email, preferred_vehicle))

    @classmethod
    def list_all(cls, search: str = '', limit: int = 200) -> list:
        if search:
            sql = """
                SELECT * FROM customers
                WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
                ORDER BY total_bookings DESC, id DESC LIMIT ?;
            """
            term = f"%{search}%"
            return cls.query(sql, (term, term, term, limit))
        return cls.query("SELECT * FROM customers ORDER BY total_bookings DESC, id DESC LIMIT ?;", (limit,))

    @classmethod
    def update(cls, customer_id: int, name: str, email: str, notes: str):
        sql = """
            UPDATE customers
            SET name = ?, email = ?, notes = ?, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (name, email, notes, customer_id))
