"""
Google Maps & Distance Matrix Service
Handles route distance calculation, Google Distance Matrix API calls, local route caching in SQLite,
and dynamic distance-based pricing.
"""
import json
import logging
import sqlite3
import datetime
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from core.config import GOOGLE_MAPS_API_KEY, DB_FILE

logger = logging.getLogger(__name__)

# Pre-calculated standard route matrix for instant offline lookups
POPULAR_ROUTES = {
    ("pune", "mumbai"): (152.0, "3h 15m via Mumbai-Pune Expressway"),
    ("mumbai", "pune"): (152.0, "3h 15m via Mumbai-Pune Expressway"),
    ("pune", "mumbai airport"): (160.0, "3h 30m via Expressway"),
    ("mumbai airport", "pune"): (160.0, "3h 30m via Expressway"),
    ("pune", "navi mumbai"): (125.0, "2h 30m via Expressway"),
    ("navi mumbai", "pune"): (125.0, "2h 30m via Expressway"),
    ("pune", "thane"): (165.0, "3h 30m via Expressway"),
    ("thane", "pune"): (165.0, "3h 30m via Expressway"),
    ("pune", "lonavala"): (68.0, "1h 30m via Expressway"),
    ("lonavala", "pune"): (68.0, "1h 30m via Expressway"),
    ("pune", "mahabaleshwar"): (120.0, "3h 15m via NH48"),
    ("mahabaleshwar", "pune"): (120.0, "3h 15m via NH48"),
    ("pune", "shirdi"): (185.0, "4h 30m via Ahmednagar"),
    ("shirdi", "pune"): (185.0, "4h 30m via Ahmednagar"),
    ("pune", "alibaug"): (142.0, "3h 45m via Khopoli"),
    ("alibaug", "pune"): (142.0, "3h 45m via Khopoli"),
    ("pune", "panvel"): (118.0, "2h 15m via Expressway"),
    ("panvel", "pune"): (118.0, "2h 15m via Expressway"),
    ("pune", "dadar"): (155.0, "3h 20m via Expressway"),
    ("dadar", "pune"): (155.0, "3h 20m via Expressway"),
    ("pune", "borivali"): (175.0, "3h 45m via Western Express"),
    ("borivali", "pune"): (175.0, "3h 45m via Western Express")
}

class MapsService:
    @staticmethod
    def _ensure_cache_table():
        """Ensures route_cache table exists in SQLite database."""
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS route_cache (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        origin_query TEXT NOT NULL,
                        destination_query TEXT NOT NULL,
                        distance_km REAL NOT NULL,
                        duration_text TEXT NOT NULL,
                        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(origin_query, destination_query)
                    );
                """)
        except Exception as e:
            logger.warning(f"Error ensuring route_cache table: {e}")

    @classmethod
    def normalize_location_name(cls, query: str) -> str:
        """Simplifies address string for lookup matching."""
        q = (query or "").lower().strip()
        for city in ["mumbai airport", "navi mumbai", "mumbai", "pune", "thane", "panvel", "dadar", "borivali", "lonavala", "mahabaleshwar", "shirdi", "alibaug"]:
            if city in q:
                return city
        return q

    @classmethod
    def get_cached_route(cls, origin: str, destination: str):
        """Checks DB cache for previously queried route."""
        cls._ensure_cache_table()
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    "SELECT distance_km, duration_text FROM route_cache WHERE origin_query = ? AND destination_query = ?",
                    (origin.lower().strip(), destination.lower().strip())
                )
                row = cur.fetchone()
                if row:
                    return float(row['distance_km']), row['duration_text']
        except Exception as e:
            logger.debug(f"Route cache lookup error: {e}")
        return None

    @classmethod
    def save_cached_route(cls, origin: str, destination: str, distance_km: float, duration_text: str):
        """Saves queried route into DB cache."""
        cls._ensure_cache_table()
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO route_cache (origin_query, destination_query, distance_km, duration_text, cached_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    (origin.lower().strip(), destination.lower().strip(), distance_km, duration_text)
                )
        except Exception as e:
            logger.debug(f"Route cache save error: {e}")

    @classmethod
    def calculate_distance(cls, origin: str, destination: str) -> dict:
        """
        Calculates distance and duration between two locations:
        1. Checks SQLite route cache.
        2. Checks popular offline routes matrix.
        3. Calls Google Distance Matrix API if GOOGLE_MAPS_API_KEY is configured.
        4. Gracefully defaults to estimated intercity distance.
        """
        orig_clean = (origin or "Pune").strip()
        dest_clean = (destination or "Mumbai").strip()

        # 1. DB Cache
        cached = cls.get_cached_route(orig_clean, dest_clean)
        if cached:
            return {
                "distance_km": cached[0],
                "duration_text": cached[1],
                "source": "database_cache",
                "origin": orig_clean,
                "destination": dest_clean
            }

        # 2. Known popular routes matrix
        norm_orig = cls.normalize_location_name(orig_clean)
        norm_dest = cls.normalize_location_name(dest_clean)
        pair = (norm_orig, norm_dest)
        if pair in POPULAR_ROUTES:
            km, dur = POPULAR_ROUTES[pair]
            cls.save_cached_route(orig_clean, dest_clean, km, dur)
            return {
                "distance_km": km,
                "duration_text": dur,
                "source": "popular_route_matrix",
                "origin": orig_clean,
                "destination": dest_clean
            }

        # 3. Google Distance Matrix API (if key available)
        if GOOGLE_MAPS_API_KEY:
            try:
                url = (
                    f"https://maps.googleapis.com/maps/api/distancematrix/json"
                    f"?origins={quote(orig_clean)}&destinations={quote(dest_clean)}"
                    f"&key={GOOGLE_MAPS_API_KEY}&units=metric"
                )
                req = Request(url, headers={"User-Agent": "SangitaTravels/1.0"})
                with urlopen(req, timeout=5) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    if data.get('status') == 'OK':
                        row = data.get('rows', [{}])[0]
                        elem = row.get('elements', [{}])[0]
                        if elem.get('status') == 'OK':
                            meters = elem.get('distance', {}).get('value', 150000)
                            km = round(meters / 1000.0, 1)
                            dur = elem.get('duration', {}).get('text', '3h 15m')
                            cls.save_cached_route(orig_clean, dest_clean, km, dur)
                            return {
                                "distance_km": km,
                                "duration_text": dur,
                                "source": "google_distance_matrix",
                                "origin": orig_clean,
                                "destination": dest_clean
                            }
            except Exception as e:
                logger.warning(f"Google Maps API call failed: {e}")

        # 4. Fallback default
        default_km = 150.0
        default_dur = "3h 15m via Expressway"
        cls.save_cached_route(orig_clean, dest_clean, default_km, default_dur)
        return {
            "distance_km": default_km,
            "duration_text": default_dur,
            "source": "fallback_estimate",
            "origin": orig_clean,
            "destination": dest_clean
        }

    @classmethod
    def compute_fare_breakdown(cls, pickup: str, drop: str, vehicle_rule: dict, trip_type: str = 'oneway') -> dict:
        """
        Computes comprehensive transparent dynamic fare:
        - Base KM fare = (distance_km * per_km)
        - Expressway Toll = ₹320 (cars)
        - Driver allowance
        - Round trip base & airport rates
        """
        route = cls.calculate_distance(pickup, drop)
        dist_km = route['distance_km']
        duration = route['duration_text']

        per_km = float(vehicle_rule.get('per_km', 12.0))
        min_km = float(vehicle_rule.get('min_km', 130.0))
        driver_allowance = float(vehicle_rule.get('driver_allowance', 300.0))
        oneway_base = float(vehicle_rule.get('oneway_pune_mumbai', 2299.0))
        roundtrip_base = float(vehicle_rule.get('roundtrip_base', 4500.0))
        airport_rate = float(vehicle_rule.get('airport_rate', 2299.0))

        toll = 320.0  # Expressway standard toll

        t_type = (trip_type or 'oneway').lower()
        if t_type == 'roundtrip':
            billed_km = max(dist_km * 2.0, 300.0)  # Standard 300km min per day
            km_charge = billed_km * per_km
            toll_total = toll * 2.0
            allowance_total = driver_allowance * 1.5
            total = max(roundtrip_base, km_charge + toll_total + allowance_total)
        elif t_type == 'airport':
            billed_km = max(dist_km, min_km)
            total = airport_rate
            toll_total = toll
            allowance_total = driver_allowance
        else:  # oneway / outstation
            billed_km = max(dist_km, min_km)
            km_charge = billed_km * per_km
            toll_total = toll
            allowance_total = driver_allowance
            calc_fare = km_charge + toll_total + allowance_total
            total = max(oneway_base, calc_fare)

        final_fare = round(total)

        return {
            "pickup": pickup,
            "drop": drop,
            "distance_km": dist_km,
            "duration_text": duration,
            "trip_type": t_type,
            "vehicle_name": vehicle_rule.get('vehicle_name', 'Cab'),
            "per_km_rate": per_km,
            "billed_km": billed_km,
            "toll_charge": toll_total,
            "driver_allowance": allowance_total,
            "estimated_fare": final_fare,
            "all_inclusive": True
        }
