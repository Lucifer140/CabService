"""
WhatsApp Business API Service
Provides automated transactional messaging via WhatsApp Cloud API with graceful wa.me deep-link fallback.
Zero external dependencies (uses standard library urllib.request).
"""
import json
import logging
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from core.config import (
    WHATSAPP_ENABLED,
    WHATSAPP_API_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ADMIN_RECIPIENT,
    SUPPORT_PHONE,
    BUSINESS_NAME,
)

logger = logging.getLogger(__name__)

class WhatsAppService:
    @staticmethod
    def normalize_phone(phone: str) -> str:
        """Sanitizes phone number to international E.164 without plus sign (e.g., 919876543210)."""
        clean = ''.join(ch for ch in phone if ch.isdigit())
        if len(clean) == 10:
            return f"91{clean}"
        if len(clean) == 12 and clean.startswith('91'):
            return clean
        if len(clean) == 11 and clean.startswith('0'):
            return f"91{clean[1:]}"
        return clean

    @classmethod
    def generate_deep_link(cls, phone: str, text: str) -> str:
        """Generates standard wa.me direct chat link with prefilled URL-encoded message."""
        clean_phone = cls.normalize_phone(phone)
        encoded_text = quote(text)
        return f"https://wa.me/{clean_phone}?text={encoded_text}"

    @classmethod
    def format_booking_message(cls, booking: dict) -> str:
        """Builds clean, structured text for customer booking confirmation."""
        ref = booking.get('booking_ref', 'N/A')
        pickup = booking.get('pickup_location', 'Pune')
        drop = booking.get('drop_location', 'Mumbai')
        date_str = booking.get('travel_date', '')
        time_str = booking.get('travel_time', 'Flexible')
        return_date = booking.get('return_date')
        veh = booking.get('vehicle_name') or booking.get('vehicle_key', 'Cab').upper()
        fare = booking.get('estimated_fare', 0)
        pax = booking.get('passengers', 1)

        msg = [
            f"🚕 *{BUSINESS_NAME}*",
            "━━━━━━━━━━━━━━━━━━━━━━",
            "✅ *Booking Request Confirmed!*",
            f"• *Reference*: `{ref}`",
            f"• *Route*: {pickup} ➔ {drop}",
            f"• *Travel Date*: {date_str} ({time_str})",
        ]

        if return_date:
            msg.append(f"• *Return Date*: {return_date}")

        msg.extend([
            f"• *Vehicle*: {veh} ({pax} Pax)",
            f"• *Estimated Fare*: ₹{int(fare)} (All-Inclusive)",
            "━━━━━━━━━━━━━━━━━━━━━━",
            "📌 *Includes*: Toll Tax, AC Sedan/SUV, Driver Allowance & Fuel.",
            f"🔍 *Track Ride Live*: https://punemumbaicab.com/#/track-booking?ref={ref}&phone={booking.get('customer_phone', '')}",
            "💳 *Payment*: Pay driver directly after journey completion.",
            f"📞 *24/7 Helpline*: (+91) {SUPPORT_PHONE}",
            "Thank you for choosing Sangita Travels Pune!"
        ])

        return "\n".join(msg)

    @classmethod
    def format_admin_alert(cls, booking: dict) -> str:
        """Builds notification alert text for admin dispatch operations."""
        ref = booking.get('booking_ref', 'N/A')
        name = booking.get('customer_name', 'Guest')
        phone = booking.get('customer_phone', 'N/A')
        pickup = booking.get('pickup_location', 'Pune')
        drop = booking.get('drop_location', 'Mumbai')
        date_str = booking.get('travel_date', '')
        time_str = booking.get('travel_time', '')
        return_date = booking.get('return_date')
        veh = booking.get('vehicle_name') or booking.get('vehicle_key', 'Cab')
        fare = booking.get('estimated_fare', 0)
        pax = booking.get('passengers', 1)

        msg = [
            "🚨 *NEW CAB DISPATCH ALERT*",
            "━━━━━━━━━━━━━━━━━━━━━━",
            f"• *Ref*: `{ref}`",
            f"• *Customer*: {name} ({phone})",
            f"• *Route*: {pickup} ➔ {drop}",
            f"• *Pickup*: {date_str} at {time_str}",
        ]
        if return_date:
            msg.append(f"• *Return*: {return_date}")
        msg.extend([
            f"• *Vehicle*: {veh} ({pax} Pax)",
            f"• *Fare*: ₹{int(fare)}",
            "━━━━━━━━━━━━━━━━━━━━━━",
            "Please assign verified driver in Admin Desk."
        ])
        return "\n".join(msg)

    @classmethod
    def format_driver_assignment(cls, booking: dict, driver_name: str, driver_phone: str, vehicle_plate: str) -> str:
        """Builds notification text when driver is allocated to a booking."""
        ref = booking.get('booking_ref', 'N/A')
        pickup = booking.get('pickup_location', '')
        date_str = booking.get('travel_date', '')
        time_str = booking.get('travel_time', '')

        return (
            f"🚕 *{BUSINESS_NAME} — Driver Assigned*\n"
            "━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Your ride *{ref}* on {date_str} ({time_str}) is assigned:\n\n"
            f"👤 *Driver Name*: {driver_name}\n"
            f"📞 *Driver Phone*: (+91) {driver_phone}\n"
            f"🚘 *Vehicle No*: {vehicle_plate}\n"
            f"📍 *Pickup*: {pickup}\n\n"
            "Driver will contact you 30 minutes before pickup. Have a safe journey!"
        )

    @classmethod
    def send_message(cls, to_phone: str, message_text: str) -> dict:
        """
        Sends text message via WhatsApp Cloud API or returns fallback link.
        Returns dict with status, provider, and response details.
        """
        clean_phone = cls.normalize_phone(to_phone)
        fallback_link = cls.generate_deep_link(clean_phone, message_text)

        if not WHATSAPP_ENABLED or not WHATSAPP_API_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
            logger.info("WhatsApp Cloud API disabled or unconfigured; using deep link fallback.")
            return {
                "success": True,
                "sent_via_api": False,
                "recipient": clean_phone,
                "fallback_url": fallback_link,
                "reason": "WhatsApp API credentials not configured in .env (fallback ready)"
            }

        endpoint = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message_text
            }
        }

        try:
            req = Request(
                endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {WHATSAPP_API_TOKEN}"
                },
                method="POST"
            )
            with urlopen(req, timeout=10) as response:
                res_body = response.read().decode('utf-8')
                res_data = json.loads(res_body)
                msg_id = res_data.get('messages', [{}])[0].get('id', 'sent')
                logger.info(f"WhatsApp Cloud API message sent to {clean_phone}: {msg_id}")
                return {
                    "success": True,
                    "sent_via_api": True,
                    "message_id": msg_id,
                    "recipient": clean_phone,
                    "fallback_url": fallback_link
                }
        except HTTPError as e:
            err_msg = e.read().decode('utf-8') if e.fp else str(e)
            logger.warning(f"WhatsApp API HTTP Error ({e.code}): {err_msg}")
            return {
                "success": False,
                "sent_via_api": False,
                "error": err_msg,
                "recipient": clean_phone,
                "fallback_url": fallback_link
            }
        except (URLError, Exception) as e:
            logger.warning(f"WhatsApp API Connection Error: {str(e)}")
            return {
                "success": False,
                "sent_via_api": False,
                "error": str(e),
                "recipient": clean_phone,
                "fallback_url": fallback_link
            }

    @classmethod
    def send_booking_confirmation(cls, booking: dict) -> dict:
        """
        Dual notification:
        1. Sends booking confirmation to customer.
        2. Sends dispatch alert to admin WhatsApp recipient.
        """
        cust_phone = booking.get('customer_phone', '')
        cust_msg = cls.format_booking_message(booking)
        cust_res = cls.send_message(cust_phone, cust_msg)

        # Notify Admin / Dispatch Desk
        admin_res = None
        if WHATSAPP_ADMIN_RECIPIENT:
            admin_msg = cls.format_admin_alert(booking)
            admin_res = cls.send_message(WHATSAPP_ADMIN_RECIPIENT, admin_msg)

        return {
            "customer_notification": cust_res,
            "admin_notification": admin_res,
            "fallback_url": cust_res.get('fallback_url')
        }
