"""
Google Maps & Distance Matrix Service
Handles route distance calculation, Google Routes / Distance Matrix API calls, local route caching in SQLite,
and dynamic distance-based pricing with toll estimation.
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

# Pre-calculated verified route matrix with road distance (km), duration, and standard car toll (INR)
# Values represent actual highway road routes across Maharashtra.
POPULAR_ROUTES = {
    ("pune", "mumbai"): (152.0, "3h 15m via Mumbai-Pune Expressway", 320.0),
    ("mumbai", "pune"): (152.0, "3h 15m via Mumbai-Pune Expressway", 320.0),
    ("pune", "mumbai airport"): (160.0, "3h 30m via Expressway", 320.0),
    ("mumbai airport", "pune"): (160.0, "3h 30m via Expressway", 320.0),
    ("pune", "nashik"): (212.0, "4h 30m via NH60 Pune-Nashik Hwy", 190.0),
    ("nashik", "pune"): (212.0, "4h 30m via NH60 Pune-Nashik Hwy", 190.0),
    ("pune", "navi mumbai"): (125.0, "2h 30m via Expressway", 320.0),
    ("navi mumbai", "pune"): (125.0, "2h 30m via Expressway", 320.0),
    ("pune", "thane"): (165.0, "3h 30m via Expressway", 320.0),
    ("thane", "pune"): (165.0, "3h 30m via Expressway", 320.0),
    ("pune", "lonavala"): (68.0, "1h 30m via Expressway", 120.0),
    ("lonavala", "pune"): (68.0, "1h 30m via Expressway", 120.0),
    ("pune", "mahabaleshwar"): (120.0, "3h 15m via NH48", 140.0),
    ("mahabaleshwar", "pune"): (120.0, "3h 15m via NH48", 140.0),
    ("pune", "shirdi"): (185.0, "4h 30m via Ahmednagar Hwy", 130.0),
    ("shirdi", "pune"): (185.0, "4h 30m via Ahmednagar Hwy", 130.0),
    ("pune", "alibaug"): (142.0, "3h 45m via Khopoli", 320.0),
    ("alibaug", "pune"): (142.0, "3h 45m via Khopoli", 320.0),
    ("pune", "panvel"): (118.0, "2h 15m via Expressway", 320.0),
    ("panvel", "pune"): (118.0, "2h 15m via Expressway", 320.0),
    ("pune", "dadar"): (155.0, "3h 20m via Expressway", 320.0),
    ("dadar", "pune"): (155.0, "3h 20m via Expressway", 320.0),
    ("pune", "borivali"): (175.0, "3h 45m via Western Express", 320.0),
    ("borivali", "pune"): (175.0, "3h 45m via Western Express", 320.0),
    ("pune", "kolhapur"): (235.0, "4h 45m via NH48", 240.0),
    ("kolhapur", "pune"): (235.0, "4h 45m via NH48", 240.0),
    ("pune", "goa"): (445.0, "9h 30m via Kolhapur-Anmod", 380.0),
    ("goa", "pune"): (445.0, "9h 30m via Kolhapur-Anmod", 380.0),
}

class MapsService:
    @staticmethod
    def _ensure_cache_table():
        """Ensures route_cache table exists in SQLite database with toll columns."""
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS route_cache (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        origin_query TEXT NOT NULL,
                        destination_query TEXT NOT NULL,
                        distance_km REAL NOT NULL,
                        duration_text TEXT NOT NULL,
                        toll_amount REAL DEFAULT 0.0,
                        toll_available INTEGER DEFAULT 1,
                        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(origin_query, destination_query)
                    );
                """)
                # Ensure existing table has toll columns if created previously
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("PRAGMA table_info(route_cache);")
                cols = {r["name"] for r in cur.fetchall()}
                if "toll_amount" not in cols:
                    conn.execute("ALTER TABLE route_cache ADD COLUMN toll_amount REAL DEFAULT 0.0;")
                if "toll_available" not in cols:
                    conn.execute("ALTER TABLE route_cache ADD COLUMN toll_available INTEGER DEFAULT 1;")
        except Exception as e:
            logger.warning(f"Error ensuring route_cache table: {e}")

    @classmethod
    def normalize_location_name(cls, query: str) -> str:
        """Simplifies address string for lookup matching."""
        q = (query or "").lower().strip()
        cities = [
            "mumbai airport", "navi mumbai", "mumbai", "pune", "nashik", "shirdi",
            "thane", "panvel", "dadar", "borivali", "lonavala", "mahabaleshwar",
            "alibaug", "kolhapur", "goa"
        ]
        for city in cities:
            if city in q:
                return city
        return q

    @classmethod
    def get_cached_route(cls, origin: str, destination: str):
        """Checks DB cache for previously queried route with toll data."""
        cls._ensure_cache_table()
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(
                    """
                    SELECT distance_km, duration_text, toll_amount, toll_available 
                    FROM route_cache 
                    WHERE origin_query = ? AND destination_query = ?
                    """,
                    (origin.lower().strip(), destination.lower().strip())
                )
                row = cur.fetchone()
                if row:
                    toll_amt = float(row['toll_amount']) if 'toll_amount' in row.keys() and row['toll_amount'] is not None else 0.0
                    toll_avail = bool(row['toll_available']) if 'toll_available' in row.keys() and row['toll_available'] is not None else (toll_amt > 0)
                    return float(row['distance_km']), row['duration_text'], toll_amt, toll_avail
        except Exception as e:
            logger.debug(f"Route cache lookup error: {e}")
        return None

    @classmethod
    def save_cached_route(cls, origin: str, destination: str, distance_km: float, duration_text: str, toll_amount: float = 0.0, toll_available: bool = True):
        """Saves queried route into DB cache."""
        cls._ensure_cache_table()
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO route_cache 
                    (origin_query, destination_query, distance_km, duration_text, toll_amount, toll_available, cached_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    (origin.lower().strip(), destination.lower().strip(), distance_km, duration_text, toll_amount, 1 if toll_available else 0)
                )
        except Exception as e:
            logger.debug(f"Route cache save error: {e}")

    @classmethod
    def calculate_distance(cls, origin: str, destination: str) -> dict:
        """
        Calculates actual road driving distance, duration, and toll estimate between two locations:
        1. Checks SQLite route cache.
        2. Checks popular offline routes matrix (includes actual highway tolls).
        3. Calls Google Routes API / Distance Matrix API if GOOGLE_MAPS_API_KEY is configured.
        4. Gracefully falls back to estimated intercity distance with clear estimation notice.
        """
        orig_clean = (origin or "Pune").strip()
        dest_clean = (destination or "Mumbai").strip()

        # Handle identical pickup and drop
        if orig_clean.lower() == dest_clean.lower():
            return {
                "distance_km": 0.0,
                "duration_text": "0 min",
                "toll_amount": 0.0,
                "toll_available": False,
                "toll_display": "No toll required",
                "source": "identical_location",
                "origin": orig_clean,
                "destination": dest_clean,
                "is_estimate": False,
                "error": "Pickup and drop locations cannot be identical"
            }

        # 1. DB Cache
        cached = cls.get_cached_route(orig_clean, dest_clean)
        if cached:
            dist_km, dur_text, toll_amt, toll_avail = cached
            return {
                "distance_km": dist_km,
                "duration_text": dur_text,
                "toll_amount": toll_amt,
                "toll_available": toll_avail,
                "toll_display": f"₹{int(toll_amt)}" if toll_avail and toll_amt > 0 else "Toll estimate unavailable",
                "source": "database_cache",
                "origin": orig_clean,
                "destination": dest_clean,
                "is_estimate": True
            }

        # 2. Known popular routes matrix
        norm_orig = cls.normalize_location_name(orig_clean)
        norm_dest = cls.normalize_location_name(dest_clean)
        pair = (norm_orig, norm_dest)
        if pair in POPULAR_ROUTES:
            route_val = POPULAR_ROUTES[pair]
            km = route_val[0]
            dur = route_val[1]
            toll = route_val[2] if len(route_val) > 2 else 0.0
            toll_avail = toll > 0 or "expressway" in dur.lower() or "nh" in dur.lower()
            cls.save_cached_route(orig_clean, dest_clean, km, dur, toll, toll_avail)
            return {
                "distance_km": km,
                "duration_text": dur,
                "toll_amount": toll,
                "toll_available": toll_avail,
                "toll_display": f"₹{int(toll)}" if toll > 0 else "Toll estimate unavailable",
                "source": "popular_route_matrix",
                "origin": orig_clean,
                "destination": dest_clean,
                "is_estimate": True
            }

        # 3. Google Routes API (computeRoutes) or Distance Matrix API
        if GOOGLE_MAPS_API_KEY:
            # 3A. Try Google Routes API with live Toll computation
            try:
                routes_url = "https://routes.googleapis.com/directions/v2:computeRoutes"
                payload = json.dumps({
                    "origin": {"address": orig_clean},
                    "destination": {"address": dest_clean},
                    "travelMode": "DRIVE",
                    "routingPreference": "TRAFFIC_AWARE",
                    "extraComputations": ["TOLLS"]
                }).encode("utf-8")
                
                req = Request(
                    routes_url,
                    data=payload,
                    headers={
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo",
                        "User-Agent": "SangitaTravels/1.0"
                    },
                    method="POST"
                )
                with urlopen(req, timeout=5) as res:
                    data = json.loads(res.read().decode("utf-8"))
                    routes_list = data.get("routes", [])
                    if routes_list:
                        route_obj = routes_list[0]
                        meters = route_obj.get("distanceMeters", 150000)
                        km = round(meters / 1000.0, 1)
                        dur_sec = int(str(route_obj.get("duration", "11700s")).rstrip("s"))
                        hours = dur_sec // 3600
                        mins = (dur_sec % 3600) // 60
                        dur = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

                        # Extract tollInfo
                        toll_info = route_obj.get("travelAdvisory", {}).get("tollInfo", {})
                        est_prices = toll_info.get("estimatedPrice", [])
                        toll_amount = 0.0
                        toll_avail = False
                        if est_prices:
                            toll_amount = sum(float(p.get("units", 0)) + float(p.get("nanos", 0)) / 1e9 for p in est_prices)
                            toll_avail = True
                        else:
                            # Fallback toll for known highway names if API does not return regional toll
                            toll_amount = 320.0 if "mumbai" in dest_clean.lower() and "pune" in orig_clean.lower() else 0.0
                            toll_avail = toll_amount > 0

                        cls.save_cached_route(orig_clean, dest_clean, km, dur, toll_amount, toll_avail)
                        return {
                            "distance_km": km,
                            "duration_text": dur,
                            "toll_amount": round(toll_amount, 2),
                            "toll_available": toll_avail,
                            "toll_display": f"₹{int(toll_amount)}" if toll_avail and toll_amount > 0 else "Toll estimate unavailable",
                            "source": "google_routes_api",
                            "origin": orig_clean,
                            "destination": dest_clean,
                            "is_estimate": True
                        }
            except Exception as e:
                logger.warning(f"Google Routes API call failed: {e}")

            # 3B. Fallback to Google Distance Matrix API
            try:
                dm_url = (
                    f"https://maps.googleapis.com/maps/api/distancematrix/json"
                    f"?origins={quote(orig_clean)}&destinations={quote(dest_clean)}"
                    f"&key={GOOGLE_MAPS_API_KEY}&units=metric"
                )
                req = Request(dm_url, headers={"User-Agent": "SangitaTravels/1.0"})
                with urlopen(req, timeout=5) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    if data.get('status') == 'OK':
                        row = data.get('rows', [{}])[0]
                        elem = row.get('elements', [{}])[0]
                        if elem.get('status') == 'OK':
                            meters = elem.get('distance', {}).get('value', 150000)
                            km = round(meters / 1000.0, 1)
                            dur = elem.get('duration', {}).get('text', '3h 15m')
                            toll = 320.0 if "mumbai" in dest_clean.lower() and "pune" in orig_clean.lower() else 0.0
                            toll_avail = toll > 0
                            cls.save_cached_route(orig_clean, dest_clean, km, dur, toll, toll_avail)
                            return {
                                "distance_km": km,
                                "duration_text": dur,
                                "toll_amount": toll,
                                "toll_available": toll_avail,
                                "toll_display": f"₹{int(toll)}" if toll > 0 else "Toll estimate unavailable",
                                "source": "google_distance_matrix",
                                "origin": orig_clean,
                                "destination": dest_clean,
                                "is_estimate": True
                            }
            except Exception as e:
                logger.warning(f"Google Distance Matrix API call failed: {e}")

        # 4. Standard default fallback
        is_mumbai_pune = (
            ("mumbai" in dest_clean.lower() and "pune" in orig_clean.lower()) or
            ("pune" in dest_clean.lower() and "mumbai" in orig_clean.lower())
        )
        is_nashik_pune = (
            ("nashik" in dest_clean.lower() and "pune" in orig_clean.lower()) or
            ("pune" in dest_clean.lower() and "nashik" in orig_clean.lower())
        )

        if is_mumbai_pune:
            default_km = 152.0
            default_dur = "3h 15m via Expressway"
            default_toll = 320.0
            default_toll_avail = True
        elif is_nashik_pune:
            default_km = 212.0
            default_dur = "4h 30m via NH60"
            default_toll = 190.0
            default_toll_avail = True
        else:
            default_km = 45.0
            default_dur = "1h 15m (Local route)"
            default_toll = 0.0
            default_toll_avail = False

        cls.save_cached_route(orig_clean, dest_clean, default_km, default_dur, default_toll, default_toll_avail)
        return {
            "distance_km": default_km,
            "duration_text": default_dur,
            "toll_amount": default_toll,
            "toll_available": default_toll_avail,
            "toll_display": f"₹{int(default_toll)}" if (default_toll_avail and default_toll > 0) else "Toll estimate unavailable",
            "source": "fallback_estimate",
            "origin": orig_clean,
            "destination": dest_clean,
            "is_estimate": True
        }

    @classmethod
    def compute_fare_breakdown(cls, pickup: str, drop: str, vehicle_rule: dict, trip_type: str = 'oneway') -> dict:
        """
        Computes transparent, authoritative cab fare following business pricing formulas:
        Base fare = max(minimum_fare, billable_distance * per_km_rate)
        Estimated total = base fare + applicable additional charges + toll + applicable taxes - discounts
        """
        route = cls.calculate_distance(pickup, drop)
        dist_km = route.get('distance_km', 150.0)
        duration = route.get('duration_text', '3h 15m')
        toll_charge = float(route.get('toll_amount', 320.0))
        toll_available = route.get('toll_available', True)

        per_km = float(vehicle_rule.get('per_km', 13.0))
        min_km = float(vehicle_rule.get('min_km', 130.0))
        driver_allowance = float(vehicle_rule.get('driver_allowance', 300.0))
        oneway_base = float(vehicle_rule.get('oneway_pune_mumbai', 2299.0))
        roundtrip_base = float(vehicle_rule.get('roundtrip_base', 4500.0))
        airport_rate = float(vehicle_rule.get('airport_rate', 2299.0))

        t_type = (trip_type or 'oneway').lower()

        if t_type == 'roundtrip':
            # Round-trip: 2x distance, minimum 300 km daily rule
            billed_km = max(dist_km * 2.0, 300.0)
            km_charge = billed_km * per_km
            toll_total = toll_charge * 2.0 if toll_available else 0.0
            allowance_total = driver_allowance * 1.5
            calc_subtotal = km_charge + toll_total + allowance_total
            total = max(roundtrip_base, calc_subtotal)
            base_fare = roundtrip_base
        elif t_type == 'airport':
            billed_km = max(dist_km, min_km)
            km_charge = billed_km * per_km
            toll_total = toll_charge
            allowance_total = driver_allowance
            calc_subtotal = km_charge + toll_total + allowance_total
            total = max(airport_rate, calc_subtotal)
            base_fare = airport_rate
        else:  # oneway / outstation
            billed_km = max(dist_km, min_km)
            km_charge = billed_km * per_km
            toll_total = toll_charge
            allowance_total = driver_allowance
            calc_subtotal = km_charge + toll_total + allowance_total
            total = max(oneway_base, calc_subtotal)
            base_fare = oneway_base

        final_fare = round(total)

        toll_display_text = f"₹{int(toll_total)}" if (toll_available and toll_total > 0) else "Toll estimate unavailable"

        return {
            "pickup": pickup,
            "drop": drop,
            "distance_km": dist_km,
            "duration_text": duration,
            "trip_type": t_type,
            "vehicle_key": vehicle_rule.get('vehicle_key', 'dzire'),
            "vehicle_name": vehicle_rule.get('vehicle_name', 'Cab'),
            "per_km_rate": per_km,
            "min_km": min_km,
            "billed_km": billed_km,
            "base_fare": base_fare,
            "base_km_fare": round(billed_km * per_km, 2),
            "toll_charge": toll_total,
            "toll_amount": toll_total,
            "toll_available": toll_available,
            "toll_display": toll_display_text,
            "toll_included": True,
            "driver_allowance": allowance_total,
            "estimated_fare": final_fare,
            "total_fare": final_fare,
            "all_inclusive": True,
            "is_estimate": True,
            "route_source": route.get("source", "fallback")
        }
