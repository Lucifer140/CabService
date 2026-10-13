"""
Booking Management Controller
"""
import csv
import io
import json
from datetime import datetime, date as dt_date, timezone
from urllib.parse import urlparse, parse_qs
from core.response import send_json, send_error, send_csv, read_json_body, get_client_ip
from repositories.booking_repository import BookingRepository
from repositories.vehicle_repository import VehicleRepository
from repositories.pricing_repository import PricingRepository
from repositories.audit_repository import AuditRepository
from repositories.coupon_repository import CouponRepository
from services.whatsapp_service import WhatsAppService
from services.email_service import EmailService

from services.maps_service import MapsService

class BookingController:
    @staticmethod
    def create_public_booking(handler):
        body = read_json_body(handler)
        name = str(body.get('name') or body.get('customer_name') or '').strip()
        phone = str(body.get('phone') or body.get('customer_phone') or '').strip()
        email = str(body.get('email') or body.get('customer_email') or '').strip()
        pickup = str(body.get('pickup') or body.get('pickup_location') or '').strip()
        drop = str(body.get('drop') or body.get('drop_location') or '').strip()
        date = str(body.get('date') or body.get('travel_date') or '').strip()
        time_val = str(body.get('time') or body.get('travel_time') or 'Flexible').strip()
        trip_type = str(body.get('trip_type', 'oneway')).strip().lower()
        vehicle_key = str(body.get('vehicle') or body.get('vehicle_key') or 'dzire').strip().lower()
        return_date = body.get('return_date') or body.get('returnDate') or None

        # 1. Required fields check
        if not name or not phone or not pickup or not drop:
            return send_error(handler, "Name, phone, pickup, and drop locations are required.", status=400)

        # 2. Prevent identical pickup and drop
        if pickup.lower() == drop.lower():
            return send_error(handler, "Pickup and drop locations cannot be identical.", status=400)

        # 3. Phone validation (at least 10 digits)
        clean_phone_digits = ''.join(ch for ch in phone if ch.isdigit())
        if len(clean_phone_digits) < 10:
            return send_error(handler, "Please provide a valid 10-digit mobile number.", status=400)

        # 4. Travel date validation (cannot be in the past)
        if date:
            try:
                booking_dt = datetime.strptime(date, '%Y-%m-%d').date()
                if booking_dt < dt_date.today():
                    return send_error(handler, "Travel date cannot be in the past.", status=400)
            except (ValueError, TypeError):
                pass

        # 5. Vehicle and passenger capacity validation
        vehicle_name = "Cab"
        veh = VehicleRepository.get_by_key(vehicle_key)
        if veh:
            vehicle_name = veh.get('name', 'Cab')
        max_passengers = veh.get('passenger_capacity', 4) if veh else 4

        try:
            passengers = int(body.get('passengers', 4))
        except (ValueError, TypeError):
            passengers = 4

        if passengers < 1 or passengers > max_passengers:
            return send_error(
                handler,
                f"Passenger count must be between 1 and {max_passengers} for {vehicle_name}.",
                status=400
            )

        # 6. Authoritative Server-Side Fare Calculation (Business Logic Hardening)
        rule = PricingRepository.get_by_vehicle_key(vehicle_key)
        if not rule:
            rules = PricingRepository.list_all()
            rule = rules[0] if rules else None

        fare_est = 0.0
        fare_breakdown = {}
        if rule:
            fare_breakdown = MapsService.compute_fare_breakdown(pickup, drop, rule, trip_type=trip_type)
            fare_est = float(fare_breakdown.get('total_fare') or fare_breakdown.get('estimated_fare', 0.0))

        # Fallback to base pricing if route calculation yields zero
        if fare_est <= 0:
            client_fare = float(body.get('fare') or body.get('estimated_fare') or 0.0)
            fare_est = client_fare if client_fare >= 500.0 else float(rule.get('oneway_pune_mumbai', 2299.0) if rule else 2299.0)

        # 7. Authoritative Coupon Verification
        coupon_code = str(body.get('coupon') or body.get('coupon_code') or '').strip().upper()
        discount_val = 0.0
        applied_msg = ''
        if coupon_code:
            c_res = CouponRepository.validate_coupon(coupon_code, fare_est)
            if c_res.get('valid'):
                discount_val = c_res.get('discount', 0.0)
                CouponRepository.increment_used_count(c_res['coupon_id'])
                fare_est = c_res.get('final_fare', fare_est)
                applied_msg = f" (Promo {coupon_code} applied: -₹{int(discount_val)})"

        # 8. Build Authoritative Quotation Snapshot
        dist_val = float(fare_breakdown.get('distance_km', 0.0))
        dur_val = str(fare_breakdown.get('duration_text', ''))
        toll_val = float(fare_breakdown.get('toll_amount', 0.0))
        quotation_snapshot = {
            "route": f"{pickup} ➔ {drop}",
            "distance_km": dist_val,
            "duration_text": dur_val,
            "trip_type": trip_type,
            "vehicle_key": vehicle_key,
            "vehicle_name": vehicle_name,
            "per_km_rate": fare_breakdown.get('per_km_rate', 0.0),
            "billed_km": fare_breakdown.get('billed_km', 0.0),
            "base_fare": fare_breakdown.get('base_fare', 0.0),
            "base_km_fare": fare_breakdown.get('base_km_fare', 0.0),
            "toll_amount": toll_val,
            "toll_available": fare_breakdown.get('toll_available', True),
            "toll_included": fare_breakdown.get('toll_included', True),
            "driver_allowance": fare_breakdown.get('driver_allowance', 0.0),
            "coupon_code": coupon_code or None,
            "coupon_discount": discount_val,
            "final_fare": fare_est,
            "pricing_rule_id": rule.get('id') if rule else None,
            "quotation_timestamp": datetime.now(timezone.utc).isoformat()
        }

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
            "quoted_amount": fare_breakdown.get('total_fare', fare_est),
            "final_amount": fare_est,
            "passengers": passengers,
            "distance_km": dist_val,
            "duration_text": dur_val,
            "toll_amount": toll_val,
            "quotation_snapshot": json.dumps(quotation_snapshot),
            "customer_notes": f"Booked via website by {name} ({passengers} passengers)" + (f" - Return: {return_date}" if return_date else "") + applied_msg,
            "internal_notes": f"Quotation: {dist_val}km ({dur_val}), Toll: ₹{int(toll_val)}, Base: ₹{int(fare_breakdown.get('base_fare', fare_est))}"
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

        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
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
