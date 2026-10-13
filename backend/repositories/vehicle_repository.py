"""
Vehicle Fleet Repository
"""
from repositories.base_repository import BaseRepository

class VehicleRepository(BaseRepository):
    @classmethod
    def list_all(cls, active_only: bool = False) -> list:
        if active_only:
            sql = "SELECT *, display_order AS sort_order FROM vehicles WHERE is_active = 1 ORDER BY display_order ASC, id ASC;"
        else:
            sql = "SELECT *, display_order AS sort_order FROM vehicles ORDER BY display_order ASC, id ASC;"
        return cls.query(sql)

    @classmethod
    def get_by_key(cls, vehicle_key: str) -> dict:
        return cls.query_one("SELECT *, display_order AS sort_order FROM vehicles WHERE vehicle_key = ?;", (vehicle_key,))

    @classmethod
    def create(cls, data: dict):
        sql = """
            INSERT INTO vehicles (
                vehicle_key, name, category, passenger_capacity, luggage_capacity,
                description, image_url, pricing_per_km, pricing_base, status, is_active, display_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (
            data.get('vehicle_key', ''),
            data.get('name', ''),
            data.get('category', 'Sedan'),
            int(data.get('passenger_capacity', 4)),
            str(data.get('luggage_capacity', '2 Bags')),
            data.get('description', ''),
            data.get('image_url', ''),
            float(data.get('pricing_per_km', 12.0)),
            float(data.get('pricing_base', 2299.)),
            data.get('status', 'AVAILABLE'),
            int(data.get('is_active', 1)),
            int(data.get('display_order', 0))
        ))

    @classmethod
    def update(cls, vehicle_key: str, data: dict):
        sql = """
            UPDATE vehicles
            SET name = ?, category = ?, passenger_capacity = ?, luggage_capacity = ?,
                description = ?, image_url = ?, pricing_per_km = ?, pricing_base = ?,
                status = ?, is_active = ?, display_order = ?, updated_at = datetime('now')
            WHERE vehicle_key = ?;
        """
        cls.execute(sql, (
            data.get('name', ''),
            data.get('category', 'Sedan'),
            int(data.get('passenger_capacity', 4)),
            str(data.get('luggage_capacity', '2 Bags')),
            data.get('description', ''),
            data.get('image_url', ''),
            float(data.get('pricing_per_km', 12.0)),
            float(data.get('pricing_base', 2299.0)),
            data.get('status', 'AVAILABLE'),
            int(data.get('is_active', 1)),
            int(data.get('display_order', 0)),
            vehicle_key
        ))

    @classmethod
    def delete(cls, vehicle_key: str):
        cls.execute("DELETE FROM vehicles WHERE vehicle_key = ?;", (vehicle_key,))
