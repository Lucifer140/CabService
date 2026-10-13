"""
Analytics & Tracking Events Repository
"""
import json
import datetime
from repositories.base_repository import BaseRepository

class AnalyticsRepository(BaseRepository):
    @classmethod
    def track_event(cls, event_type: str, page_path: str = '', metadata_json: str = '{}', ip_address: str = '', user_agent: str = ''):
        try:
            meta = json.loads(metadata_json) if isinstance(metadata_json, str) else dict(metadata_json)
        except Exception:
            meta = {}
        if page_path:
            meta['page_path'] = page_path
        final_meta = json.dumps(meta)

        sql = """
            INSERT INTO analytics_events (event_type, metadata_json, ip_address, user_agent)
            VALUES (?, ?, ?, ?);
        """
        return cls.execute(sql, (event_type, final_meta, ip_address, user_agent[:250]))

    @classmethod
    def get_overview(cls) -> dict:
        # 1. Traffic event totals
        totals_rows = cls.query("""
            SELECT event_type, COUNT(*) as count
            FROM analytics_events
            GROUP BY event_type;
        """)
        raw_totals = {r['event_type']: r['count'] for r in totals_rows}

        page_views = sum(v for k, v in raw_totals.items() if 'page' in k.lower())
        widgets = sum(v for k, v in raw_totals.items() if 'booking' in k.lower() or 'widget' in k.lower())
        whatsapp = sum(v for k, v in raw_totals.items() if 'whatsapp' in k.lower())
        phones = sum(v for k, v in raw_totals.items() if 'phone' in k.lower() or 'call' in k.lower())
        conv_rate = round((widgets / max(1, page_views)) * 100, 1)

        traffic = {
            "page_views": page_views,
            "widget_interactions": widgets,
            "whatsapp_clicks": whatsapp,
            "phone_clicks": phones,
            "conversion_rate": conv_rate,
            "totals": raw_totals
        }

        # 2. Revenue statistics from bookings
        rev_row = cls.query_one("""
            SELECT 
                COUNT(*) as total_bookings,
                COALESCE(SUM(estimated_fare), 0) as total_estimated_fares,
                COALESCE(SUM(CASE WHEN status IN ('COMPLETED', 'CONFIRMED', 'IN_TRANSIT') THEN COALESCE(final_amount, estimated_fare) ELSE 0 END), 0) as confirmed_revenue,
                COALESCE(AVG(estimated_fare), 0) as average_fare
            FROM bookings;
        """) or {}

        revenue = {
            "total_bookings": rev_row.get('total_bookings', 0),
            "total_estimated_fares": float(rev_row.get('total_estimated_fares', 0.0)),
            "confirmed_revenue": float(rev_row.get('confirmed_revenue', 0.0)),
            "average_fare": round(float(rev_row.get('average_fare', 0.0)), 2),
        }

        # 3. Fares and Bookings by Vehicle Type
        veh_fares = cls.query("""
            SELECT 
                vehicle_name, 
                vehicle_key,
                COUNT(*) as booking_count,
                COALESCE(SUM(estimated_fare), 0) as total_fare,
                COALESCE(AVG(estimated_fare), 0) as avg_fare
            FROM bookings
            GROUP BY vehicle_name, vehicle_key
            ORDER BY total_fare DESC;
        """)

        # 4. Popular Routes Breakdown
        popular_routes = cls.query("""
            SELECT 
                pickup_location, 
                drop_location, 
                COUNT(*) as trip_count, 
                COALESCE(SUM(estimated_fare), 0) as total_fare,
                COALESCE(AVG(estimated_fare), 0) as avg_fare
            FROM bookings
            GROUP BY pickup_location, drop_location
            ORDER BY trip_count DESC, total_fare DESC
            LIMIT 10;
        """)

        # 5. Vehicle Utilization Dashboard
        total_b_count = max(1, revenue['total_bookings'])
        veh_util_rows = cls.query("""
            SELECT 
                v.vehicle_key,
                v.name,
                v.category,
                COALESCE(b.booking_count, 0) as booking_count,
                COALESCE(b.total_fare, 0) as total_revenue
            FROM vehicles v
            LEFT JOIN (
                SELECT vehicle_key, COUNT(*) as booking_count, SUM(estimated_fare) as total_fare
                FROM bookings
                GROUP BY vehicle_key
            ) b ON LOWER(v.vehicle_key) = LOWER(b.vehicle_key)
            ORDER BY booking_count DESC, v.display_order ASC;
        """)

        vehicle_utilization = [
            {
                "vehicle_key": r['vehicle_key'],
                "name": r['name'],
                "category": r['category'],
                "booking_count": r['booking_count'],
                "total_revenue": float(r['total_revenue']),
                "share_percent": round((r['booking_count'] / total_b_count) * 100, 1)
            }
            for r in veh_util_rows
        ]

        # 6. Trends: Daily (14 days), Weekly (6 weeks), Monthly (6 months)
        today = datetime.date.today()

        # Daily
        daily_labels = []
        daily_bookings = []
        daily_revenue = []
        for i in range(13, -1, -1):
            day = today - datetime.timedelta(days=i)
            day_str = day.strftime('%Y-%m-%d')
            daily_labels.append(day.strftime('%d %b'))
            r = cls.query_one("SELECT COUNT(*) as c, COALESCE(SUM(estimated_fare), 0) as rev FROM bookings WHERE DATE(created_at) = ?;", (day_str,))
            daily_bookings.append(r['c'])
            daily_revenue.append(float(r['rev']))

        # Weekly
        weekly_labels = []
        weekly_bookings = []
        weekly_revenue = []
        for w in range(5, -1, -1):
            w_start = today - datetime.timedelta(weeks=w, days=today.weekday())
            w_end = w_start + datetime.timedelta(days=6)
            weekly_labels.append(f"{w_start.strftime('%d %b')}")
            r = cls.query_one("""
                SELECT COUNT(*) as c, COALESCE(SUM(estimated_fare), 0) as rev
                FROM bookings
                WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?;
            """, (w_start.strftime('%Y-%m-%d'), w_end.strftime('%Y-%m-%d')))
            weekly_bookings.append(r['c'])
            weekly_revenue.append(float(r['rev']))

        # Monthly
        monthly_labels = []
        monthly_bookings = []
        monthly_revenue = []
        for m in range(5, -1, -1):
            m_year = today.year
            m_month = today.month - m
            while m_month <= 0:
                m_month += 12
                m_year -= 1
            m_prefix = f"{m_year:04d}-{m_month:02d}"
            m_label = datetime.date(m_year, m_month, 1).strftime('%b %Y')
            monthly_labels.append(m_label)
            r = cls.query_one("""
                SELECT COUNT(*) as c, COALESCE(SUM(estimated_fare), 0) as rev
                FROM bookings
                WHERE strftime('%Y-%m', created_at) = ?;
            """, (m_prefix,))
            monthly_bookings.append(r['c'])
            monthly_revenue.append(float(r['rev']))

        trends = {
            "daily": {"labels": daily_labels, "bookings": daily_bookings, "revenue": daily_revenue},
            "weekly": {"labels": weekly_labels, "bookings": weekly_bookings, "revenue": weekly_revenue},
            "monthly": {"labels": monthly_labels, "bookings": monthly_bookings, "revenue": monthly_revenue}
        }

        # 7. Recent Events
        recent_rows = cls.query("""
            SELECT id, event_type, metadata_json, ip_address, created_at
            FROM analytics_events
            ORDER BY id DESC LIMIT 20;
        """)

        return {
            "traffic": traffic,
            "revenue": revenue,
            "fares_by_vehicle": veh_fares,
            "popular_routes": popular_routes,
            "vehicle_utilization": vehicle_utilization,
            "trends": trends,
            "recent_events": recent_rows
        }
