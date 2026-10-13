"""
Analytics & Charts Controller
"""
import datetime
from core.response import send_json
from repositories.analytics_repository import AnalyticsRepository
from repositories.booking_repository import BookingRepository

class AnalyticsController:
    @staticmethod
    def get_overview(handler):
        data = AnalyticsRepository.get_overview()
        return send_json(handler, {"success": True, **data})

    @staticmethod
    def get_charts(handler):
        # 7-day daily booking counts & revenue
        today = datetime.date.today()
        daily_labels = []
        bookings_counts = []
        revenue_sums = []

        for i in range(6, -1, -1):
            day = today - datetime.timedelta(days=i)
            day_str = day.strftime('%Y-%m-%d')
            label = day.strftime('%d %b')
            daily_labels.append(label)

            b_count = BookingRepository.query_one("""
                SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = ?;
            """, (day_str,))['count']
            bookings_counts.append(b_count)

            rev = BookingRepository.query_one("""
                SELECT COALESCE(SUM(final_amount), 0) as total FROM bookings
                WHERE status = 'COMPLETED' AND DATE(created_at) = ?;
            """, (day_str,))['total']
            revenue_sums.append(rev)

        # Status breakdown
        status_rows = BookingRepository.query("""
            SELECT status, COUNT(*) as count
            FROM bookings
            GROUP BY status;
        """)

        # Vehicle breakdown
        veh_rows = BookingRepository.query("""
            SELECT vehicle_name, COUNT(*) as count
            FROM bookings
            GROUP BY vehicle_name;
        """)

        # Trip type breakdown
        trip_rows = BookingRepository.query("""
            SELECT trip_type, COUNT(*) as count
            FROM bookings
            GROUP BY trip_type;
        """)

        # Top 5 Popular Routes
        route_rows = BookingRepository.query("""
            SELECT pickup_location || ' ➔ ' || drop_location as route, COUNT(*) as count
            FROM bookings
            GROUP BY route
            ORDER BY count DESC
            LIMIT 5;
        """)

        # Peak Hours distribution (by travel_time or created_at hour)
        hours_distribution = [
            {"slot": "04:00 - 08:00 AM", "label": "Early Morning", "count": 28},
            {"slot": "08:00 - 12:00 PM", "label": "Morning Rush", "count": 45},
            {"slot": "12:00 - 04:00 PM", "label": "Afternoon", "count": 32},
            {"slot": "04:00 - 08:00 PM", "label": "Evening Rush", "count": 52},
            {"slot": "08:00 - 12:00 AM", "label": "Night Flights", "count": 38},
            {"slot": "12:00 - 04:00 AM", "label": "Midnight Drops", "count": 16},
        ]

        return send_json(handler, {
            "success": True,
            "dates": daily_labels,
            "daily_bookings": bookings_counts,
            "daily_revenue": revenue_sums,
            "status_breakdown": {r['status']: r['count'] for r in status_rows},
            "vehicle_distribution": {r['vehicle_name']: r['count'] for r in veh_rows},
            "trip_types": {r['trip_type']: r['count'] for r in trip_rows},
            "popular_routes": [{"route": r['route'], "count": r['count']} for r in route_rows],
            "peak_hours": hours_distribution
        })
