"""
Driver Management Repository
"""
from __future__ import annotations
from typing import Optional, Any
from repositories.base_repository import BaseRepository

class DriverRepository(BaseRepository):
    @classmethod
    def list_all(cls, status: Optional[str] = None, search: Optional[str] = None, limit: int = 200) -> list:
        conditions: list[str] = []
        params: list[Any] = []
        if status and status != 'ALL':
            conditions.append("status = ?")
            params.append(status)
        if search:
            conditions.append("(name LIKE ? OR phone LIKE ? OR license_no LIKE ? OR vehicle_assigned LIKE ?)")
            term = f"%{search}%"
            params.extend([term, term, term, term])

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"""
            SELECT id, name, phone, email, license_no, vehicle_assigned,
                   status, rating, total_trips, photo, documents_json, created_at, updated_at
            FROM drivers
            {where_clause}
            ORDER BY status = 'AVAILABLE' DESC, name ASC
            LIMIT ?;
        """
        params.append(limit)
        return cls.query(sql, tuple(params))

    @classmethod
    def get_by_id(cls, driver_id: int) -> dict:
        sql = "SELECT * FROM drivers WHERE id = ?;"
        return cls.query_one(sql, (driver_id,))

    @classmethod
    def get_by_phone(cls, phone: str) -> dict:
        sql = "SELECT * FROM drivers WHERE phone = ?;"
        return cls.query_one(sql, (phone,))

    @classmethod
    def get_stats(cls) -> dict:
        total = cls.query_one("SELECT COUNT(*) as count FROM drivers;")['count']
        available = cls.query_one("SELECT COUNT(*) as count FROM drivers WHERE status = 'AVAILABLE';")['count']
        on_trip = cls.query_one("SELECT COUNT(*) as count FROM drivers WHERE status = 'ON_TRIP';")['count']
        offline = cls.query_one("SELECT COUNT(*) as count FROM drivers WHERE status = 'OFFLINE';")['count']
        avg_rating_row = cls.query_one("SELECT ROUND(AVG(rating), 2) as avg_rating FROM drivers;")
        avg_rating = float(avg_rating_row['avg_rating']) if avg_rating_row and avg_rating_row['avg_rating'] else 4.9
        total_trips = cls.query_one("SELECT COALESCE(SUM(total_trips), 0) as total FROM drivers;")['total']

        return {
            "total_drivers": total,
            "available_drivers": available,
            "on_trip_drivers": on_trip,
            "offline_drivers": offline,
            "average_rating": avg_rating,
            "total_trips_completed": total_trips
        }

    @classmethod
    def create(cls, data: dict) -> int:
        sql = """
            INSERT INTO drivers (name, phone, email, license_no, vehicle_assigned, status, rating, total_trips, photo, documents_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (
            data.get('name', '').strip(),
            data.get('phone', '').strip(),
            data.get('email', '').strip(),
            data.get('license_no', '').strip(),
            data.get('vehicle_assigned', '').strip(),
            data.get('status', 'AVAILABLE').strip().upper(),
            float(data.get('rating', 4.9)),
            int(data.get('total_trips', 0)),
            data.get('photo', '').strip(),
            data.get('documents_json', '{}')
        ))

    @classmethod
    def update(cls, driver_id: int, data: dict):
        sql = """
            UPDATE drivers
            SET name = ?, phone = ?, email = ?, license_no = ?,
                vehicle_assigned = ?, status = ?, rating = ?, total_trips = ?,
                photo = ?, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (
            data.get('name', '').strip(),
            data.get('phone', '').strip(),
            data.get('email', '').strip(),
            data.get('license_no', '').strip(),
            data.get('vehicle_assigned', '').strip(),
            data.get('status', 'AVAILABLE').strip().upper(),
            float(data.get('rating', 4.9)),
            int(data.get('total_trips', 0)),
            data.get('photo', '').strip(),
            driver_id
        ))

    @classmethod
    def update_status(cls, driver_id: int, status: str):
        sql = "UPDATE drivers SET status = ?, updated_at = datetime('now') WHERE id = ?;"
        cls.execute(sql, (status.strip().upper(), driver_id))

    @classmethod
    def increment_trips(cls, driver_id: int):
        sql = "UPDATE drivers SET total_trips = total_trips + 1, updated_at = datetime('now') WHERE id = ?;"
        cls.execute(sql, (driver_id,))

    @classmethod
    def delete(cls, driver_id: int):
        sql = "DELETE FROM drivers WHERE id = ?;"
        cls.execute(sql, (driver_id,))
