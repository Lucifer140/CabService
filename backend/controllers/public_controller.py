"""
Public Site Data & Tracking Controller
"""
import json
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.settings_repository import SettingsRepository
from repositories.vehicle_repository import VehicleRepository
from repositories.tour_repository import TourRepository
from repositories.service_repository import ServiceRepository
from repositories.content_repository import ContentRepository
from repositories.seo_repository import SeoRepository
from repositories.analytics_repository import AnalyticsRepository
from repositories.pricing_repository import PricingRepository

class PublicController:
    @staticmethod
    def get_site_data(handler):
        settings = SettingsRepository.get_all()
        fleet = VehicleRepository.list_all(active_only=True)
        tours = TourRepository.list_all(active_only=True)
        services = ServiceRepository.list_all(active_only=True)
        content = ContentRepository.get_all()
        seo_list = SeoRepository.get_all()
        seo = {row['page_identifier']: row for row in seo_list}
        pricing = PricingRepository.list_all()

        return send_json(handler, {
            "success": True,
            "settings": settings,
            "fleet": fleet,
            "tours": tours,
            "services": services,
            "content": content,
            "seo": seo,
            "pricing": pricing
        })

    @staticmethod
    def get_public_fleet(handler):
        fleet = VehicleRepository.list_all(active_only=True)
        return send_json(handler, {"success": True, "fleet": fleet})

    @staticmethod
    def get_public_pricing(handler):
        pricing = PricingRepository.list_all()
        return send_json(handler, {"success": True, "pricing": pricing})

    @staticmethod
    def track_event(handler):
        body = read_json_body(handler)
        event_type = body.get('event_type', 'page_view')
        page_path = body.get('page_path', '/')
        metadata = body.get('metadata', {})
        ip_addr = get_client_ip(handler)
        user_agent = handler.headers.get('User-Agent', '')

        AnalyticsRepository.track_event(
            event_type=event_type,
            page_path=page_path,
            metadata_json=json.dumps(metadata) if isinstance(metadata, dict) else str(metadata),
            ip_address=ip_addr,
            user_agent=user_agent
        )
        return send_json(handler, {"success": True, "recorded": True})

    @staticmethod
    def log_client_error(handler):
        body = read_json_body(handler)
        from core.logger import get_logger
        logger = get_logger("client_error")
        ip_addr = get_client_ip(handler)
        user_agent = handler.headers.get('User-Agent', '')
        req_id = getattr(handler, 'request_id', '-')

        err_msg = body.get('message', 'Unknown client-side exception')
        stack = body.get('stack', '')
        url = body.get('url', '')

        record = logger.makeRecord(
            logger.name, 30, "(client)", 0,  # 30 = WARNING
            f"Client Exception: {err_msg} | URL: {url} | IP: {ip_addr}",
            (), None
        )
        record.request_id = req_id
        record.extra_data = {
            "client_ip": ip_addr,
            "user_agent": user_agent,
            "url": url,
            "stack": stack[:1000] if stack else '',
            "line": body.get('line'),
            "col": body.get('col')
        }
        logger.handle(record)
        return send_json(handler, {"success": True, "logged": True})

    @staticmethod
    def track_booking(handler):
        body = read_json_body(handler)
        booking_ref = str(body.get('booking_ref', '')).strip()
        phone = str(body.get('phone', '')).strip()

        if not booking_ref:
            return send_error(handler, "Booking reference number is required", status=400)
        if not phone:
            return send_error(handler, "Registered phone number is required", status=400)

        from repositories.booking_repository import BookingRepository
        booking = BookingRepository.get_by_ref_and_phone(booking_ref, phone)
        if not booking:
            return send_error(handler, "No booking found matching this reference and phone number. Please verify your details.", status=404)

        return send_json(handler, {"success": True, "booking": booking})

