"""
Booking Repository
"""
import secrets
from repositories.base_repository import BaseRepository
from repositories.customer_repository import CustomerRepository

class BookingRepository(BaseRepository):
    @classmethod
    def generate_booking_ref(cls) -> str:
        """Generates unique booking reference e.g. PTC-4821."""
        for _ in range(10):
            ref = f"PTC-{secrets.randbelow(9000) + 1000}"
            existing = cls.query_one("SELECT id FROM bookings WHERE booking_ref = ?;", (ref,))
            if not existing:
                return ref
        return f"PTC-{secrets.token_hex(3).upper()}"

    @classmethod
    def create(cls, data: dict) -> dict:
        cust_name = data.get('customer_name', '').strip()
        cust_phone = data.get('customer_phone', '').strip()
        cust_email = data.get('customer_email', '').strip()
        vehicle_key = data.get('vehicle_key', 'dzire')
        
        customer_id = None
        if cust_phone:
            customer_id = CustomerRepository.get_or_create(cust_name, cust_phone, cust_email, vehicle_key)

        booking_ref = cls.generate_booking_ref()
        sql = """
            INSERT INTO bookings (
                booking_ref, customer_id, customer_name, customer_phone, customer_email,
                trip_type, pickup_location, drop_location, travel_date, travel_time, return_date,
                vehicle_key, vehicle_name, estimated_fare, quoted_amount, final_amount,
                status, assigned_driver, driver_phone, customer_notes, internal_notes, passengers
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        b_id = cls.execute(sql, (
            booking_ref, customer_id, cust_name, cust_phone, cust_email,
            data.get('trip_type', 'oneway'),
            data.get('pickup_location', ''),
            data.get('drop_location', ''),
            data.get('travel_date', ''),
            data.get('travel_time', 'Flexible'),
            data.get('return_date', None),
            vehicle_key,
            data.get('vehicle_name', 'Cab'),
            data.get('estimated_fare', 0),
            data.get('quoted_amount', None),
            data.get('final_amount', None),
            data.get('status', 'NEW'),
            data.get('assigned_driver', 'Unassigned'),
            data.get('driver_phone', ''),
            data.get('customer_notes', ''),
            data.get('internal_notes', ''),
            data.get('passengers', 1)
        ))
        return cls.get_by_id(b_id)

    @classmethod
    def get_by_id(cls, booking_id: int) -> dict:
        sql = """
            SELECT b.*, c.name as customer_name_rel
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE b.id = ?;
        """
        return cls.query_one(sql, (booking_id,))

    @classmethod
    def list_all(cls, status: str = None, search: str = None, vehicle_key: str = None,
                 start_date: str = None, end_date: str = None, assigned_driver: str = None,
                 page: int = 1, per_page: int = 25, limit: int = None) -> dict:
        params = []
        conditions = []
        if status and status != 'ALL':
            conditions.append("b.status = ?")
            params.append(status)
        if search:
            conditions.append("(b.booking_ref LIKE ? OR b.customer_name LIKE ? OR b.customer_phone LIKE ? OR b.pickup_location LIKE ? OR b.drop_location LIKE ?)")
            term = f"%{search}%"
            params.extend([term, term, term, term, term])
        if vehicle_key and vehicle_key != 'ALL':
            conditions.append("b.vehicle_key = ?")
            params.append(vehicle_key)
        if start_date:
            conditions.append("b.travel_date >= ?")
            params.append(start_date)
        if end_date:
            conditions.append("b.travel_date <= ?")
            params.append(end_date)
        if assigned_driver and assigned_driver != 'ALL':
            if assigned_driver == 'UNASSIGNED':
                conditions.append("(b.assigned_driver IS NULL OR b.assigned_driver = '' OR b.assigned_driver = 'Unassigned')")
            else:
                conditions.append("b.assigned_driver = ?")
                params.append(assigned_driver)
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Total count
        count_sql = f"SELECT COUNT(*) as total FROM bookings b {where_clause};"
        total_row = cls.query_one(count_sql, tuple(params))
        total = total_row['total'] if total_row else 0

        # Query items
        if limit is not None:
            fetch_limit = limit
            fetch_offset = 0
        else:
            fetch_limit = per_page
            fetch_offset = max(0, (page - 1) * per_page)

        query_params = list(params)
        query_params.extend([fetch_limit, fetch_offset])

        sql = f"""
            SELECT b.*, c.name as customer_name_rel
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.id
            {where_clause}
            ORDER BY b.id DESC LIMIT ? OFFSET ?;
        """
        items = cls.query(sql, tuple(query_params))
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": fetch_limit,
            "pages": (total + fetch_limit - 1) // fetch_limit if fetch_limit > 0 else 1
        }

    @classmethod
    def bulk_update_status(cls, booking_ids: list, status: str):
        if not booking_ids:
            return
        placeholders = ', '.join(['?'] * len(booking_ids))
        sql = f"UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id IN ({placeholders});"
        params = [status] + booking_ids
        cls.execute(sql, tuple(params))

    @classmethod
    def bulk_delete(cls, booking_ids: list):
        if not booking_ids:
            return
        placeholders = ', '.join(['?'] * len(booking_ids))
        sql = f"DELETE FROM bookings WHERE id IN ({placeholders});"
        cls.execute(sql, tuple(booking_ids))

    @classmethod
    def update_status(cls, booking_id: int, status: str):
        sql = "UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?;"
        cls.execute(sql, (status, booking_id))

    @classmethod
    def assign_driver(cls, booking_id: int, driver_name: str, driver_phone: str, status: str = 'CONFIRMED'):
        sql = """
            UPDATE bookings
            SET assigned_driver = ?, driver_phone = ?, status = ?, updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (driver_name, driver_phone, status, booking_id))

    @classmethod
    def update_full(cls, booking_id: int, data: dict):
        sql = """
            UPDATE bookings
            SET customer_name = ?, customer_phone = ?, customer_email = ?,
                trip_type = ?, pickup_location = ?, drop_location = ?,
                travel_date = ?, travel_time = ?, return_date = ?,
                vehicle_key = ?, vehicle_name = ?, estimated_fare = ?,
                quoted_amount = ?, final_amount = ?, status = ?,
                assigned_driver = ?, driver_phone = ?,
                customer_notes = ?, internal_notes = ?, passengers = ?,
                updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (
            data.get('customer_name', ''),
            data.get('customer_phone', ''),
            data.get('customer_email', ''),
            data.get('trip_type', 'oneway'),
            data.get('pickup_location', ''),
            data.get('drop_location', ''),
            data.get('travel_date', ''),
            data.get('travel_time', ''),
            data.get('return_date', None),
            data.get('vehicle_key', ''),
            data.get('vehicle_name', ''),
            data.get('estimated_fare', 0),
            data.get('quoted_amount', None),
            data.get('final_amount', None),
            data.get('status', 'NEW'),
            data.get('assigned_driver', 'Unassigned'),
            data.get('driver_phone', ''),
            data.get('customer_notes', ''),
            data.get('internal_notes', ''),
            data.get('passengers', 1),
            booking_id
        ))

    @classmethod
    def delete(cls, booking_id: int):
        cls.execute("DELETE FROM bookings WHERE id = ?;", (booking_id,))

    @classmethod
    def get_summary_stats(cls) -> dict:
        today_enquiries = cls.query_one("SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = DATE('now');")['count']
        pending = cls.query_one("SELECT COUNT(*) as count FROM bookings WHERE status IN ('NEW', 'CONTACTED');")['count']
        confirmed = cls.query_one("SELECT COUNT(*) as count FROM bookings WHERE status = 'CONFIRMED';")['count']
        completed = cls.query_one("SELECT COUNT(*) as count FROM bookings WHERE status = 'COMPLETED';")['count']
        cancelled = cls.query_one("SELECT COUNT(*) as count FROM bookings WHERE status = 'CANCELLED';")['count']
        total_bookings = cls.query_one("SELECT COUNT(*) as count FROM bookings;")['count']
        active_veh = cls.query_one("SELECT COUNT(*) as count FROM vehicles WHERE is_active = 1;")['count']
        total_vehicles = cls.query_one("SELECT COUNT(*) as count FROM vehicles;")['count']
        total_users = cls.query_one("SELECT COUNT(*) as count FROM admins WHERE is_active = 1;")['count']
        try:
            total_drivers = cls.query_one("SELECT COUNT(*) as count FROM drivers;")['count']
        except Exception:
            total_drivers = 0
        monthly_enq = cls.query_one("SELECT COUNT(*) as count FROM bookings WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now');")['count']
        monthly_rev = cls.query_one("SELECT COALESCE(SUM(final_amount), 0) as total FROM bookings WHERE status = 'COMPLETED' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now');")['total']

        return {
            "today_enquiries": today_enquiries,
            "pending_bookings": pending,
            "confirmed_bookings": confirmed,
            "completed_trips": completed,
            "cancelled_bookings": cancelled,
            "total_bookings": total_bookings,
            "total_users": total_users,
            "total_drivers": total_drivers,
            "total_vehicles": total_vehicles,
            "active_vehicles": active_veh,
            "monthly_enquiries": monthly_enq,
            "monthly_revenue": monthly_rev
        }

    @classmethod
    def get_recent_bookings(cls, limit: int = 10) -> list:
        sql = """
            SELECT b.*, c.name as customer_name_rel
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.id
            ORDER BY b.id DESC LIMIT ?;
        """
        return cls.query(sql, (limit,))

    @classmethod
    def get_by_ref_and_phone(cls, booking_ref: str, phone: str) -> dict:
        clean_phone = ''.join(c for c in phone if c.isdigit())[-10:] if phone else ''
        clean_ref = booking_ref.strip().upper()
        sql = """
            SELECT b.id, b.booking_ref, b.customer_name, b.customer_phone,
                   b.trip_type, b.pickup_location, b.drop_location, b.travel_date, b.travel_time,
                   b.vehicle_name, b.estimated_fare, b.final_amount, b.status,
                   b.assigned_driver, b.driver_phone, b.created_at, b.updated_at,
                   b.payment_status, b.payment_id
            FROM bookings b
            WHERE (b.booking_ref = ? OR b.booking_ref = ? OR b.id = ?)
              AND (b.customer_phone LIKE ? OR b.customer_phone = ?);
        """
        alt_ref = f"PTC-{clean_ref}" if not clean_ref.startswith('PTC-') else clean_ref
        id_val = int(clean_ref) if clean_ref.isdigit() else -1
        phone_pattern = f"%{clean_phone}"
        return cls.query_one(sql, (clean_ref, alt_ref, id_val, phone_pattern, clean_phone))
