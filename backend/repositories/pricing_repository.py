"""
Pricing Rules Repository
"""
from repositories.base_repository import BaseRepository

class PricingRepository(BaseRepository):
    @classmethod
    def list_all(cls) -> list:
        return cls.query("SELECT * FROM pricing_rules ORDER BY id ASC;")

    @classmethod
    def get_by_id(cls, rule_id: int) -> dict:
        return cls.query_one("SELECT * FROM pricing_rules WHERE id = ?;", (rule_id,))

    @classmethod
    def get_by_vehicle_key(cls, vehicle_key: str) -> dict:
        return cls.query_one("SELECT * FROM pricing_rules WHERE vehicle_key = ?;", (vehicle_key,))

    @classmethod
    def create(cls, data: dict):
        sql = """
            INSERT INTO pricing_rules (
                vehicle_key, vehicle_name, per_km, min_km,
                driver_allowance, oneway_pune_mumbai, roundtrip_base, airport_rate, show_price_public
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (
            data.get('vehicle_key', ''),
            data.get('vehicle_name', ''),
            float(data.get('per_km', 12.0)),
            int(data.get('min_km', 130)),
            float(data.get('driver_allowance', 300.0)),
            float(data.get('oneway_pune_mumbai', 2299.0)),
            float(data.get('roundtrip_base', 4500.0)),
            float(data.get('airport_rate', 2299.0)),
            int(data.get('show_price_public', 0))
        ))

    @classmethod
    def update(cls, rule_id: int, data: dict):
        sql = """
            UPDATE pricing_rules
            SET vehicle_key = ?, vehicle_name = ?, per_km = ?, min_km = ?,
                driver_allowance = ?, oneway_pune_mumbai = ?, roundtrip_base = ?,
                airport_rate = ?, show_price_public = ?, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (
            data.get('vehicle_key', ''),
            data.get('vehicle_name', ''),
            float(data.get('per_km', 12.0)),
            int(data.get('min_km', 130)),
            float(data.get('driver_allowance', 300.0)),
            float(data.get('oneway_pune_mumbai', 2299.0)),
            float(data.get('roundtrip_base', 4500.0)),
            float(data.get('airport_rate', 2299.0)),
            int(data.get('show_price_public', 0)),
            rule_id
        ))

    @classmethod
    def delete(cls, rule_id: int):
        cls.execute("DELETE FROM pricing_rules WHERE id = ?;", (rule_id,))
