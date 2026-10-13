"""
Booking Management Controller
"""
import csv
import io
import datetime
from urllib.parse import urlparse, parse_qs
from core.response import send_json, send_error, send_csv, read_json_body, get_client_ip
from repositories.booking_repository import BookingRepository
from repositories.vehicle_repository import VehicleRepository
from repositories.pricing_repository import PricingRepository
from repositories.audit_repository import AuditRepository
from repositories.coupon_repository import CouponRepository
from services.whatsapp_service import WhatsAppService
from services.email_service import EmailService

class BookingController:
    @staticmethod
    def create_public_booking(handler):
        body = read_json_body(handler)
        name = body.get('name') or body.get('customer_name', '')
        phone = body.get('phone') or body.get('customer_phone', '')
        email = body.get('email') or body.get('customer_email', '')
        pickup = body.get('pickup') or body.get('pickup_location', '')
        drop = body.get('drop') or body.get('drop_location', '')
        date = body.get('date') or body.get('travel_date', '')
        time_val = body.get('time') or body.get('travel_time', 'Flexible')
        trip_type = body.get('trip_type', 'oneway')
        vehicle_key = body.get('vehicle') or body.get('vehicle_key', 'dzire')
        passengers = int(body.get('passengers', 4))
        fare_est = float(body.get('fare') or body.get('estimated_fare') or 0.0)

        coupon_code = body.get('coupon') or body.get('coupon_code') or ''
        discount_val = 0.0
        applied_msg = ''
        if coupon_code and coupon_code.strip():
            c_res = CouponRepository.validate_coupon(coupon_code.strip(), fare_est)
            if c_res.get('valid'):
                discount_val = c_res.get('discount', 0.0)
                CouponRepository.increment_used_count(c_res['coupon_id'])
                fare_est = c_res.get('final_fare', fare_est)
                applied_msg = f" (Promo {coupon_code.strip().upper()} applied: -₹{discount_val})"

        return_date = body.get('return_date') or body.get('returnDate') or None

        if not name or not phone or not pickup or not drop:
            return send_error(handler, "Name, phone, pickup and drop locations are required.", status=400)

        vehicle_name = "Cab"
        veh = VehicleRepository.get_by_key(vehicle_key)
        if veh:
            vehicle_name = veh.get('name', 'Cab')

        booking = BookingRepository.create({
            "customer_name": name,
            "customer_phone": phone,
            "customer_email": email,
            "trip_type": trip_type,
            "pickup_location": pickup,
            "drop_location": drop,
            "travel_date": date,
            "travel_time": time_val,
            "return_date": return_date,
            "vehicle_key": vehicle_key,
            "vehicle_name": vehicle_name,
            "estimated_fare": fare_est,
            "final_amount": fare_est,
            "passengers": passengers,
            "customer_notes": f"Booked via website by {name} ({passengers} passengers)" + (f" - Return: {return_date}" if return_date else "") + applied_msg
        })

        wa_result = WhatsAppService.send_booking_confirmation(booking)
        email_result = EmailService.send_booking_confirmation(booking)
        EmailService.send_admin_alert(booking)

        return send_json(handler, {
            "success": True,
            "message": "Booking received! Our dispatch team will contact you shortly.",
            "booking_ref": booking['booking_ref'],
            "booking_id": booking['id'],
            "fare": fare_est,
            "phone": phone,
            "whatsapp_url": wa_result.get('fallback_url'),
            "whatsapp_sent": wa_result.get('customer_notification', {}).get('sent_via_api', False),
            "email_sent": email_result.get('success', False)
        }, status=201)

    @staticmethod
    def trigger_daily_digest(handler, user: dict):
        summary = BookingRepository.get_summary_stats()
        bookings_res = BookingRepository.list_all(limit=50)
        bookings = bookings_res.get('items', []) if isinstance(bookings_res, dict) else bookings_res
        res = EmailService.send_daily_digest(bookings, summary)
        AuditRepository.log(user['id'], user['username'], 'TRIGGER_DIGEST', 'system', 'Dispatched daily digest email', get_client_ip(handler))
        return send_json(handler, {
            "success": True,
            "message": "Daily digest dispatched successfully.",
            "details": res
        })

    @staticmethod
    def list_bookings(handler):
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        status = qs.get('status', ['ALL'])[0]
        search = qs.get('search', [None])[0]
        vehicle = qs.get('vehicle', [None])[0]
        start_date = qs.get('start_date', [None])[0]
        end_date = qs.get('end_date', [None])[0]
        driver = qs.get('driver', [None])[0]

        try:
            page = int(qs.get('page', ['1'])[0])
        except ValueError:
            page = 1
        try:
            per_page = int(qs.get('per_page', ['25'])[0])
        except ValueError:
            per_page = 25

        res = BookingRepository.list_all(
            status=status,
            search=search,
            vehicle_key=vehicle,
            start_date=start_date,
            end_date=end_date,
            assigned_driver=driver,
            page=page,
            per_page=per_page
        )
        return send_json(handler, {
            "success": True,
            "bookings": res.get('items', []),
            "total": res.get('total', 0),
            "page": res.get('page', 1),
            "pages": res.get('pages', 1),
            "per_page": res.get('per_page', 25)
        })

    @staticmethod
    def bulk_status(handler, user: dict):
        body = read_json_body(handler)
        ids = body.get('ids', [])
        status = body.get('status', '').strip().upper()
        allowed = ('NEW', 'CONTACTED', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')
        if not ids or not isinstance(ids, list):
            return send_error(handler, "A list of booking IDs is required.", status=400)
        if status not in allowed:
            return send_error(handler, f"Invalid status. Allowed: {allowed}", status=400)

        BookingRepository.bulk_update_status(ids, status)
        AuditRepository.log(user['id'], user['username'], 'BULK_STATUS', 'bookings', f"Updated {len(ids)} bookings to {status}", get_client_ip(handler))
        return send_json(handler, {
            "success": True,
            "message": f"Updated {len(ids)} bookings to {status} successfully."
        })

    @staticmethod
    def bulk_delete(handler, user: dict):
        body = read_json_body(handler)
        ids = body.get('ids', [])
        if not ids or not isinstance(ids, list):
            return send_error(handler, "A list of booking IDs is required.", status=400)

        BookingRepository.bulk_delete(ids)
        AuditRepository.log(user['id'], user['username'], 'BULK_DELETE', 'bookings', f"Deleted {len(ids)} bookings", get_client_ip(handler))
        return send_json(handler, {
            "success": True,
            "message": f"Deleted {len(ids)} bookings successfully."
        })

    @staticmethod
    def get_summary(handler):
        summary = BookingRepository.get_summary_stats()
        recent = BookingRepository.get_recent_bookings(limit=10)
        return send_json(handler, {
            "success": True,
            "summary": summary,
            "stats": summary,
            "recent_bookings": recent
        })

    @staticmethod
    def export_csv(handler):
        parsed = urlparse(handler.path)
        qs = parse_qs(parsed.query)
        status = qs.get('status', ['ALL'])[0]
        search = qs.get('search', [None])[0]
        vehicle = qs.get('vehicle', [None])[0]
        start_date = qs.get('start_date', [None])[0]
        end_date = qs.get('end_date', [None])[0]
        driver = qs.get('driver', [None])[0]

        res = BookingRepository.list_all(
            status=status,
            search=search,
            vehicle_key=vehicle,
            start_date=start_date,
            end_date=end_date,
            assigned_driver=driver,
            limit=2000
        )
        bookings = res.get('items', []) if isinstance(res, dict) else res

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Reference", "Customer Name", "Phone", "Email",
            "Trip Type", "Pickup", "Drop", "Date", "Time", "Vehicle",
            "Est Fare", "Final Amount", "Status", "Driver", "Driver Phone", "Created At"
        ])
        for b in bookings:
            writer.writerow([
                b.get('id', ''),
                b.get('booking_ref', ''),
                b.get('customer_name', ''),
                b.get('customer_phone', ''),
                b.get('customer_email', ''),
                b.get('trip_type', ''),
                b.get('pickup_location', ''),
                b.get('drop_location', ''),
                b.get('travel_date', ''),
                b.get('travel_time', ''),
                b.get('vehicle_name', ''),
                b.get('estimated_fare', 0),
                b.get('final_amount', ''),
                b.get('status', ''),
                b.get('assigned_driver', ''),
                b.get('driver_phone', ''),
                b.get('created_at', '')
            ])

        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M')
        return send_csv(handler, f"cab_bookings_{timestamp}.csv", output.getvalue())

    @staticmethod
    def get_booking(handler, booking_id: int):
        b = BookingRepository.get_by_id(booking_id)
        if not b:
            return send_error(handler, "Booking not found", status=404)
        return send_json(handler, {"success": True, "booking": b})

    @staticmethod
    def update_status(handler, booking_id: int, user: dict):
        body = read_json_body(handler)
        status = body.get('status', '').strip().upper()
        allowed = ('NEW', 'CONTACTED', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')
        if status not in allowed:
            return send_error(handler, f"Invalid status. Allowed: {allowed}", status=400)

        BookingRepository.update_status(booking_id, status)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_STATUS', 'bookings', f"Booking {booking_id} -> {status}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": f"Status updated to {status}"})

    @staticmethod
    def assign_driver(handler, booking_id: int, user: dict):
        body = read_json_body(handler)
        driver_name = body.get('driver_name', '').strip()
        driver_phone = body.get('driver_phone', '').strip()
        status = body.get('status', 'CONFIRMED').strip()

        if not driver_name:
            return send_error(handler, "Driver name is required", status=400)

        BookingRepository.assign_driver(booking_id, driver_name, driver_phone, status=status)
        b = BookingRepository.get_by_id(booking_id)
        wa_sent = False
        if b and b.get('customer_phone'):
            driver_msg = WhatsAppService.format_driver_assignment(
                b, driver_name, driver_phone, body.get('vehicle_number', 'Assigned Cab')
            )
            res = WhatsAppService.send_message(b['customer_phone'], driver_msg)
            wa_sent = res.get('sent_via_api', False)

        AuditRepository.log(user['id'], user['username'], 'ASSIGN_DRIVER', 'bookings', f"Assigned {driver_name} to Booking {booking_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Driver assigned successfully", "whatsapp_notified": wa_sent})

    @staticmethod
    def update_booking(handler, booking_id: int, user: dict):
        body = read_json_body(handler)
        b = BookingRepository.get_by_id(booking_id)
        if not b:
            return send_error(handler, "Booking not found", status=404)

        BookingRepository.update_full(booking_id, body)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_BOOKING', 'bookings', f"Updated Booking {booking_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Booking updated successfully."})

    @staticmethod
    def delete_booking(handler, booking_id: int, user: dict):
        BookingRepository.delete(booking_id)
        AuditRepository.log(user['id'], user['username'], 'DELETE_BOOKING', 'bookings', f"Deleted Booking {booking_id}", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": "Booking deleted."})
