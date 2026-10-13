"""
Request Router & API Dispatcher
Dispatches incoming HTTP requests to corresponding domain controllers with security enforcement.
"""
from urllib.parse import urlparse
from core.security import check_permission
from core.response import send_json, send_error, get_auth_token
from repositories.user_repository import UserRepository
from controllers import (
    AuthController,
    PublicController,
    BookingController,
    CustomerController,
    FleetController,
    TourController,
    ServiceController,
    CmsController,
    MediaController,
    PricingController,
    AnalyticsController,
    UserController,
    SettingsController,
    PaymentController,
    HealthController,
    SeoController,
    ReviewController,
    DriverController,
    CouponController,
    BlogController
)




def authenticate_user(handler, required_perm=None):
    """
    Validates session token and RBAC permission.
    Returns (True, user) if valid; sends error response and returns (False, None) otherwise.
    """
    token = get_auth_token(handler)
    if not token:
        send_error(handler, "Unauthorized: Authentication token required.", status=401)
        return False, None

    user = UserRepository.get_session_user(token)
    if not user:
        send_error(handler, "Session expired or invalid.", status=401)
        return False, None

    if required_perm:
        if required_perm == 'SUPER_ADMIN':
            if user.get('role') != 'SUPER_ADMIN':
                send_error(handler, "Access denied: Super Admin role required.", status=403)
                return False, None
        elif not check_permission(user, required_perm):
            send_error(handler, f"Access denied: Missing '{required_perm}' permission.", status=403)
            return False, None

    return True, user

class ApiRouter:
    @classmethod
    def normalize_path(cls, path: str) -> str:
        # Strip trailing slashes except for root
        if len(path) > 1 and path.endswith('/'):
            path = path[:-1]
        # Normalize /api/admin/* to /api/*
        if path.startswith('/api/admin/'):
            path = path.replace('/api/admin/', '/api/', 1)
        return path

    @classmethod
    def dispatch_get(cls, handler, path: str):
        path = cls.normalize_path(path)

        # Health & Readiness Probes
        if path in ('/api/health', '/health'):
            return HealthController.get_health(handler)
        if path in ('/api/readiness', '/readiness'):
            return HealthController.get_readiness(handler)

        # Dynamic SEO Endpoints
        if path in ('/sitemap.xml', '/api/sitemap.xml', '/api/public/sitemap.xml'):
            return SeoController.get_sitemap(handler)
        if path in ('/robots.txt', '/api/robots.txt'):
            return SeoController.get_robots(handler)

        # Public Endpoints

        if path in ('/api/public/site-data', '/api/site-data'):
            return PublicController.get_site_data(handler)

        if path in ('/api/auth-check', '/api/auth/check'):
            return AuthController.auth_check(handler)
        if path in ('/api/fleet', '/api/public/fleet'):
            return FleetController.list_fleet(handler)
        if path in ('/api/tours', '/api/public/tours'):
            return TourController.list_tours(handler)
        if path.startswith('/api/public/tours/') or path.startswith('/api/tours/'):
            slug = path.split('/')[-1]
            return TourController.get_tour_by_slug(handler, slug)
        if path in ('/api/services', '/api/public/services'):
            return ServiceController.list_services(handler)
        if path in ('/api/content', '/api/public/content'):
            return CmsController.get_content(handler)
        if path in ('/api/pricing/public', '/api/public/pricing'):
            return PublicController.get_public_pricing(handler)
        if path in ('/api/public/route-distance', '/api/route-distance'):
            return PricingController.calculate_route(handler)
        if path in ('/api/public/reviews', '/api/reviews/public'):
            return ReviewController.list_public_reviews(handler)

        if path in ('/api/blog', '/api/public/blog'):
            return BlogController.list_public_posts(handler)

        if path.startswith('/api/public/blog/'):
            slug = path.split('/')[-1]
            return BlogController.get_public_post(handler, slug)

        if path.startswith('/api/blog/') and not path.startswith('/api/blog-posts') and not path.startswith('/api/blog/admin'):
            slug = path.split('/')[-1]
            return BlogController.get_public_post(handler, slug)

        # Authenticated Endpoints
        if path in ('/api/admin/blog', '/api/blog-posts'):
            ok, user = authenticate_user(handler, 'dashboard')
            if not ok: return
            return BlogController.list_admin_posts(handler)

        if path.startswith('/api/admin/blog/'):
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                ok, user = authenticate_user(handler, 'dashboard')
                if not ok: return
                return BlogController.get_admin_post(handler, int(parts[3]))

        if path in ('/api/drivers', '/api/admin/drivers'):
            ok, user = authenticate_user(handler, 'dashboard')
            if not ok: return
            return DriverController.list_drivers(handler)

        if path == '/api/drivers/stats':
            ok, user = authenticate_user(handler, 'dashboard')
            if not ok: return
            return DriverController.get_stats(handler)

        if path.startswith('/api/drivers/'):
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                ok, user = authenticate_user(handler, 'dashboard')
                if not ok: return
                return DriverController.get_driver(handler, int(parts[3]))

        if path in ('/api/coupons', '/api/admin/coupons'):
            ok, user = authenticate_user(handler, 'pricing:read')
            if not ok: return
            return CouponController.list_coupons(handler)

        if path in ('/api/reviews', '/api/admin/reviews'):
            ok, user = authenticate_user(handler, 'dashboard')
            if not ok: return
            return ReviewController.list_admin_reviews(handler)
        if path in ('/api/dashboard/summary', '/api/stats'):
            ok, user = authenticate_user(handler, 'dashboard')
            if not ok: return
            return BookingController.get_summary(handler)

        if path == '/api/dashboard/charts':
            ok, user = authenticate_user(handler, 'analytics:read')
            if not ok: return
            return AnalyticsController.get_charts(handler)

        if path == '/api/bookings/export-csv' or (path.startswith('/api/bookings/') and path.endswith('/export-csv')):
            ok, user = authenticate_user(handler, 'export:read')
            if not ok: return
            return BookingController.export_csv(handler)

        if path == '/api/bookings':
            ok, user = authenticate_user(handler, 'bookings:read')
            if not ok: return
            return BookingController.list_bookings(handler)

        if (path.startswith('/api/bookings/') or path.startswith('/api/public/bookings/')) and path.endswith('/invoice'):
            parts = path.split('/')
            b_id = parts[3] if parts[2] == 'bookings' else parts[4]
            if b_id.isdigit():
                return PaymentController.get_invoice(handler, int(b_id))

        if path.startswith('/api/bookings/'):
            ok, user = authenticate_user(handler, 'bookings:read')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return BookingController.get_booking(handler, int(parts[3]))

        if path == '/api/customers':
            ok, user = authenticate_user(handler, 'customers:read')
            if not ok: return
            return CustomerController.list_customers(handler)

        if path.startswith('/api/customers/'):
            ok, user = authenticate_user(handler, 'customers:read')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return CustomerController.get_customer(handler, int(parts[3]))

        if path == '/api/media':
            ok, user = authenticate_user(handler, 'media:read')
            if not ok: return
            return MediaController.list_media(handler)

        if path in ('/api/pricing', '/api/pricing-rules'):
            ok, user = authenticate_user(handler, 'pricing:read')
            if not ok: return
            return PricingController.list_pricing(handler)

        if path == '/api/seo':
            ok, user = authenticate_user(handler, 'seo:read')
            if not ok: return
            return SettingsController.list_seo(handler)

        if path == '/api/analytics':
            ok, user = authenticate_user(handler, 'analytics:read')
            if not ok: return
            return AnalyticsController.get_overview(handler)

        if path == '/api/users':
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            return UserController.list_users(handler)

        if path in ('/api/audit-logs', '/api/audit'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            return SettingsController.list_audit_logs(handler)

        if path == '/api/settings':
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            return SettingsController.get_settings(handler)

        if path == '/api/export/backup-sql':
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            return SettingsController.backup_sql(handler, user)

        return send_error(handler, "Endpoint not found", status=404)

    @classmethod
    def dispatch_post(cls, handler, path: str):
        path = cls.normalize_path(path)

        if path in ('/api/login', '/api/auth/login'):
            return AuthController.login(handler)

        if path in ('/api/logout', '/api/auth/logout'):
            return AuthController.logout(handler)

        if path in ('/api/auth/forgot-password', '/api/forgot-password'):
            return AuthController.forgot_password(handler)

        if path in ('/api/auth/reset-password', '/api/reset-password'):
            return AuthController.reset_password(handler)

        if path in ('/api/admin/send-digest', '/api/bookings/send-digest'):
            ok, user = authenticate_user(handler, 'dashboard')
            if not ok: return
            return BookingController.trigger_daily_digest(handler, user)

        if path in ('/api/public/track-event', '/api/track-event'):
            return PublicController.track_event(handler)

        if path in ('/api/public/track-booking', '/api/track-booking'):
            return PublicController.track_booking(handler)

        if path in ('/api/public/client-error', '/api/client-error', '/api/track-error'):
            return PublicController.log_client_error(handler)

        if path in ('/api/public/validate-coupon', '/api/validate-coupon'):
            return CouponController.validate_public_coupon(handler)

        if path in ('/api/coupons', '/api/admin/coupons'):
            ok, user = authenticate_user(handler, 'pricing:write')
            if not ok: return
            return CouponController.create_coupon(handler, user)

        if path in ('/api/admin/blog', '/api/blog-posts', '/api/blog'):
            ok, user = authenticate_user(handler, 'content:write')
            if not ok: return
            return BlogController.create_post(handler, user)


        if path in ('/api/public/reviews', '/api/reviews', '/api/reviews/submit'):
            return ReviewController.submit_review(handler)

        if path.startswith('/api/reviews/') and path.endswith('/approve'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return ReviewController.toggle_approve(handler, int(parts[3]), user)

        if path.startswith('/api/reviews/') and path.endswith('/delete'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return ReviewController.delete_review(handler, int(parts[3]), user)

        if path in ('/api/bookings/bulk-status', '/api/bookings/bulk_status'):
            ok, user = authenticate_user(handler, 'bookings:write')
            if not ok: return
            return BookingController.bulk_status(handler, user)

        if path in ('/api/bookings/bulk-delete', '/api/bookings/bulk_delete'):
            ok, user = authenticate_user(handler, 'bookings:write')
            if not ok: return
            return BookingController.bulk_delete(handler, user)

        if path in ('/api/bookings', '/api/public/bookings'):
            return BookingController.create_public_booking(handler)

        if path in ('/api/public/calculate-fare', '/api/calculate-fare'):
            return PricingController.calculate_fare(handler)

        if path in ('/api/payments/create-order', '/api/payments/order'):
            return PaymentController.create_order(handler)

        if path in ('/api/payments/verify', '/api/payments/verify-payment'):
            return PaymentController.verify_payment(handler)

        if path == '/api/payments/refund':
            ok, user = authenticate_user(handler, 'bookings:write')
            if not ok: return
            return PaymentController.refund_payment(handler, user)


        if path in ('/api/media', '/api/media/upload'):
            ok, user = authenticate_user(handler, 'media:write')
            if not ok: return
            return MediaController.upload_media(handler, user)

        if path == '/api/content/batch':
            ok, user = authenticate_user(handler, 'content:write')
            if not ok: return
            return CmsController.batch_update(handler, user)

        if path in ('/api/settings', '/api/settings/batch'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            return SettingsController.batch_settings(handler, user)

        if path == '/api/seo':
            ok, user = authenticate_user(handler, 'seo:write')
            if not ok: return
            return SettingsController.update_seo(handler, user)

        if path == '/api/fleet':
            ok, user = authenticate_user(handler, 'fleet:write')
            if not ok: return
            return FleetController.create_vehicle(handler, user)

        if path == '/api/tours':
            ok, user = authenticate_user(handler, 'tours:write')
            if not ok: return
            return TourController.create_tour(handler, user)

        if path == '/api/services':
            ok, user = authenticate_user(handler, 'services:write')
            if not ok: return
            return ServiceController.create_service(handler, user)

        if path in ('/api/pricing', '/api/pricing-rules'):
            ok, user = authenticate_user(handler, 'pricing:write')
            if not ok: return
            return PricingController.create_pricing(handler, user)

        if path == '/api/users':
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            return UserController.create_user(handler, user)

        if path.startswith('/api/users/') and path.endswith('/toggle-status'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 5 and parts[3].isdigit():
                return UserController.toggle_status(handler, int(parts[3]), user)

        if path in ('/api/drivers', '/api/admin/drivers'):
            ok, user = authenticate_user(handler, 'fleet:write')
            if not ok: return
            return DriverController.create_driver(handler, user)

        if path.startswith('/api/drivers/') and path.endswith('/status'):
            parts = path.split('/')
            if len(parts) >= 5 and parts[3].isdigit():
                ok, user = authenticate_user(handler, 'fleet:write')
                if not ok: return
                return DriverController.update_status(handler, int(parts[3]), user)

        # Booking Action Sub-Routes
        if path.startswith('/api/bookings/'):
            ok, user = authenticate_user(handler, 'bookings:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 5 and parts[3].isdigit():
                b_id = int(parts[3])
                action = parts[4]
                if action == 'status':
                    return BookingController.update_status(handler, b_id, user)
                elif action == 'assign':
                    return BookingController.assign_driver(handler, b_id, user)
                elif action == 'update':
                    return BookingController.update_booking(handler, b_id, user)
                elif action == 'delete':
                    return BookingController.delete_booking(handler, b_id, user)

        return send_error(handler, "Endpoint not found", status=404)

    @classmethod
    def dispatch_put(cls, handler, path: str):
        path = cls.normalize_path(path)
        if path.startswith('/api/bookings/'):
            ok, user = authenticate_user(handler, 'bookings:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return BookingController.update_booking(handler, int(parts[3]), user)

        if path.startswith('/api/customers/'):
            ok, user = authenticate_user(handler, 'customers:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return CustomerController.update_customer(handler, int(parts[3]), user)

        if path.startswith('/api/drivers/'):
            ok, user = authenticate_user(handler, 'fleet:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return DriverController.update_driver(handler, int(parts[3]), user)

        if path.startswith('/api/fleet/'):
            ok, user = authenticate_user(handler, 'fleet:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4:
                return FleetController.update_vehicle(handler, parts[3], user)

        if path.startswith('/api/tours/'):
            ok, user = authenticate_user(handler, 'tours:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return TourController.update_tour(handler, int(parts[3]), user)

        if path.startswith('/api/services/'):
            ok, user = authenticate_user(handler, 'services:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return ServiceController.update_service(handler, int(parts[3]), user)

        if path.startswith('/api/content/'):
            ok, user = authenticate_user(handler, 'content:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4:
                return CmsController.update_block(handler, parts[3], user)

        if path.startswith('/api/pricing/') or path.startswith('/api/pricing-rules/'):
            ok, user = authenticate_user(handler, 'pricing:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return PricingController.update_pricing(handler, int(parts[3]), user)

        if path.startswith('/api/coupons/'):
            ok, user = authenticate_user(handler, 'pricing:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return CouponController.update_coupon(handler, int(parts[3]), user)

        if path.startswith('/api/blog/') or path.startswith('/api/admin/blog/'):
            ok, user = authenticate_user(handler, 'content:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return BlogController.update_post(handler, int(parts[3]), user)


        if path == '/api/seo' or path.startswith('/api/seo/'):
            ok, user = authenticate_user(handler, 'seo:write')
            if not ok: return
            parts = path.split('/')
            path_page = parts[3] if len(parts) >= 4 and parts[3] else None
            return SettingsController.update_seo(handler, user, path_page)

        if path.startswith('/api/users/'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return UserController.update_user(handler, int(parts[3]), user)

        if path == '/api/settings':
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            return SettingsController.update_settings(handler, user)

        return send_error(handler, "Endpoint not found", status=404)

    @classmethod
    def dispatch_delete(cls, handler, path: str):
        path = cls.normalize_path(path)
        if path.startswith('/api/bookings/'):
            ok, user = authenticate_user(handler, 'bookings:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return BookingController.delete_booking(handler, int(parts[3]), user)

        if path.startswith('/api/drivers/'):
            ok, user = authenticate_user(handler, 'fleet:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return DriverController.delete_driver(handler, int(parts[3]), user)

        if path.startswith('/api/fleet/'):
            ok, user = authenticate_user(handler, 'fleet:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4:
                return FleetController.delete_vehicle(handler, parts[3], user)

        if path.startswith('/api/tours/'):
            ok, user = authenticate_user(handler, 'tours:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return TourController.delete_tour(handler, int(parts[3]), user)

        if path.startswith('/api/services/'):
            ok, user = authenticate_user(handler, 'services:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return ServiceController.delete_service(handler, int(parts[3]), user)

        if path.startswith('/api/media/'):
            ok, user = authenticate_user(handler, 'media:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return MediaController.delete_media(handler, int(parts[3]), user)

        if path.startswith('/api/pricing/') or path.startswith('/api/pricing-rules/'):
            ok, user = authenticate_user(handler, 'pricing:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return PricingController.delete_pricing(handler, int(parts[3]), user)

        if path.startswith('/api/coupons/'):
            ok, user = authenticate_user(handler, 'pricing:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return CouponController.delete_coupon(handler, int(parts[3]), user)

        if path.startswith('/api/blog/') or path.startswith('/api/admin/blog/'):
            ok, user = authenticate_user(handler, 'content:write')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return BlogController.delete_post(handler, int(parts[3]), user)


        if path.startswith('/api/users/'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return UserController.delete_user(handler, int(parts[3]), user)

        if path.startswith('/api/reviews/'):
            ok, user = authenticate_user(handler, 'SUPER_ADMIN')
            if not ok: return
            parts = path.split('/')
            if len(parts) >= 4 and parts[3].isdigit():
                return ReviewController.delete_review(handler, int(parts[3]), user)

        return send_error(handler, "Endpoint not found", status=404)
