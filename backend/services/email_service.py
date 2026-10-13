"""
Email Notification Service
Handles transactional emails (booking confirmations, admin alerts, daily digests, password resets)
using Python's standard library smtplib with HTML templates and zero external dependencies.
"""
import os
import smtplib
import logging
import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.parse import quote

from core.config import (
    SMTP_ENABLED,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    ADMIN_NOTIFICATION_EMAIL,
    BUSINESS_NAME,
    SUPPORT_PHONE,
    SUPPORT_EMAIL,
    BUSINESS_ADDRESS,
    BASE_DIR
)

logger = logging.getLogger(__name__)
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')

class EmailService:
    @staticmethod
    def _render_template(template_name: str, context: dict) -> str:
        """Reads HTML template and replaces {{variable}} placeholders with context values."""
        file_path = os.path.join(TEMPLATES_DIR, template_name)
        if not os.path.exists(file_path):
            logger.error(f"Email template not found: {file_path}")
            return f"<html><body><p>{context.get('content', 'Notification')}</p></body></html>"

        with open(file_path, 'r', encoding='utf-8') as f:
            template = f.read()

        # Handle simple conditionals like {% if return_date %} ... {% endif %}
        if 'return_date' in context and context['return_date']:
            template = template.replace('{% if return_date %}', '').replace('{% endif %}', '')
        else:
            # Remove the return date block if empty
            import re
            template = re.sub(r'\{%\s*if return_date\s*%\}.*?\{%\s*endif\s*%\}', '', template, flags=re.DOTALL)

        # Replace all {{key}} tags
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            template = template.replace(placeholder, str(value if value is not None else ''))

        return template

    @classmethod
    def send_email(cls, to_email: str, subject: str, html_body: str, text_body: str = None) -> dict:
        """
        Sends an email using standard library smtplib.
        Returns result dict with delivery status.
        """
        if not to_email or '@' not in to_email:
            return {"success": False, "error": "Invalid recipient email address"}

        if not SMTP_ENABLED or not SMTP_HOST or not SMTP_USER:
            logger.info(f"SMTP is disabled or credentials unconfigured. Simulated email to: {to_email} | Subject: {subject}")
            return {
                "success": True,
                "simulated": True,
                "recipient": to_email,
                "subject": subject,
                "message": "SMTP disabled in .env (email simulated)"
            }

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{BUSINESS_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        try:
            logger.info(f"Connecting to SMTP server {SMTP_HOST}:{SMTP_PORT}...")
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
            server.ehlo()
            try:
                server.starttls()
                server.ehlo()
            except Exception as tls_err:
                logger.debug(f"starttls notice: {tls_err}")

            if SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)

            server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
            server.quit()
            logger.info(f"Email successfully delivered to {to_email} (Subject: {subject})")
            return {"success": True, "simulated": False, "recipient": to_email, "subject": subject}
        except Exception as e:
            logger.warning(f"Failed to send email to {to_email} via SMTP: {str(e)}")
            return {"success": False, "simulated": False, "error": str(e), "recipient": to_email}

    @classmethod
    def send_booking_confirmation(cls, booking: dict) -> dict:
        """Sends rich branded booking confirmation email to the passenger."""
        customer_email = booking.get('customer_email')
        if not customer_email:
            return {"success": False, "reason": "No customer email provided"}

        ref = booking.get('booking_ref', 'N/A')
        trip_type = booking.get('trip_type', 'oneway').capitalize()
        phone_clean = ''.join(ch for ch in str(booking.get('customer_phone', '')) if ch.isdigit())
        if len(phone_clean) == 10:
            phone_clean = f"91{phone_clean}"

        wa_text = quote(
            f"Namaste Sangita Travels, regarding my booking {ref} ({booking.get('pickup_location')} to {booking.get('drop_location')})."
        )
        whatsapp_url = f"https://wa.me/918261021008?text={wa_text}"

        context = {
            "business_name": BUSINESS_NAME,
            "support_phone": SUPPORT_PHONE,
            "support_email": SUPPORT_EMAIL,
            "business_address": BUSINESS_ADDRESS,
            "booking_ref": ref,
            "customer_name": booking.get('customer_name', 'Valued Customer'),
            "trip_type": trip_type,
            "pickup_location": booking.get('pickup_location', 'Pune'),
            "drop_location": booking.get('drop_location', 'Mumbai'),
            "travel_date": booking.get('travel_date', ''),
            "travel_time": booking.get('travel_time', ''),
            "return_date": booking.get('return_date', ''),
            "vehicle_name": booking.get('vehicle_name') or booking.get('vehicle_key', 'AC Cab').upper(),
            "passengers": booking.get('passengers', 1),
            "estimated_fare": int(booking.get('estimated_fare', 0)),
            "whatsapp_url": whatsapp_url
        }

        html = cls._render_template('booking_confirmation.html', context)
        subject = f"✅ Booking Confirmed: {ref} ({context['pickup_location']} ➔ {context['drop_location']}) - {BUSINESS_NAME}"
        return cls.send_email(customer_email, subject, html)

    @classmethod
    def send_admin_alert(cls, booking: dict) -> dict:
        """Sends new dispatch alert to admin desk."""
        admin_email = ADMIN_NOTIFICATION_EMAIL or SUPPORT_EMAIL
        if not admin_email:
            return {"success": False, "reason": "Admin notification email not set"}

        ref = booking.get('booking_ref', 'N/A')
        cust_phone = booking.get('customer_phone', '')
        phone_clean = ''.join(ch for ch in str(cust_phone) if ch.isdigit())
        if len(phone_clean) == 10:
            phone_clean = f"91{phone_clean}"

        context = {
            "business_name": BUSINESS_NAME,
            "booking_ref": ref,
            "customer_name": booking.get('customer_name', 'Guest'),
            "customer_phone": cust_phone,
            "normalized_phone": phone_clean,
            "customer_email": booking.get('customer_email', 'Not provided'),
            "pickup_location": booking.get('pickup_location', 'Pune'),
            "drop_location": booking.get('drop_location', 'Mumbai'),
            "travel_date": booking.get('travel_date', ''),
            "travel_time": booking.get('travel_time', ''),
            "return_date": booking.get('return_date', ''),
            "vehicle_name": booking.get('vehicle_name') or booking.get('vehicle_key', 'Cab'),
            "passengers": booking.get('passengers', 1),
            "trip_type": booking.get('trip_type', 'oneway').upper(),
            "estimated_fare": int(booking.get('estimated_fare', 0)),
            "admin_url": "http://localhost:8080/admin"
        }

        html = cls._render_template('admin_alert.html', context)
        subject = f"🚨 New Dispatch Alert: {ref} - {context['pickup_location']} to {context['drop_location']}"
        return cls.send_email(admin_email, subject, html)

    @classmethod
    def send_daily_digest(cls, bookings_list: list, summary_stats: dict) -> dict:
        """Sends daily digest email to admin."""
        admin_email = ADMIN_NOTIFICATION_EMAIL or SUPPORT_EMAIL
        today_str = datetime.date.today().strftime('%d %B %Y')

        # Build table rows HTML
        rows = []
        for b in bookings_list[:25]:
            status = b.get('status', 'NEW')
            badge_class = f"status-{status}"
            rows.append(
                f"<tr>"
                f"<td><strong>{b.get('booking_ref', '')}</strong></td>"
                f"<td>{b.get('customer_name', '')} ({b.get('customer_phone', '')})</td>"
                f"<td>{b.get('pickup_location', '')} ➔ {b.get('drop_location', '')}</td>"
                f"<td>{b.get('travel_date', '')} {b.get('travel_time', '')}</td>"
                f"<td>₹{int(b.get('estimated_fare', 0))}</td>"
                f"<td><span class='status-badge {badge_class}'>{status}</span></td>"
                f"</tr>"
            )
        table_html = "\n".join(rows) if rows else "<tr><td colspan='6' style='text-align:center;'>No bookings logged today.</td></tr>"

        context = {
            "business_name": BUSINESS_NAME,
            "date_today": today_str,
            "total_count": summary_stats.get('total_bookings', len(bookings_list)),
            "total_revenue": int(summary_stats.get('total_revenue', 0)),
            "new_count": summary_stats.get('new_bookings', 0),
            "table_rows": table_html,
            "admin_url": "http://localhost:8080/admin"
        }

        html = cls._render_template('daily_digest.html', context)
        subject = f"📊 Daily Bookings Digest ({today_str}) - {BUSINESS_NAME}"
        return cls.send_email(admin_email, subject, html)

    @classmethod
    def send_password_reset(cls, to_email: str, username: str, reset_code: str, reset_url: str) -> dict:
        """Sends password reset instruction email to admin user."""
        context = {
            "business_name": BUSINESS_NAME,
            "username": username,
            "reset_code": reset_code,
            "reset_url": reset_url
        }
        html = cls._render_template('password_reset.html', context)
        subject = f"🔐 Password Reset Request - {BUSINESS_NAME} Admin"
        return cls.send_email(to_email, subject, html)
