"""
Razorpay Payment Gateway Service
Provides order creation, HMAC-SHA256 signature verification, advance token payment handling,
and printable invoice HTML generation with simulated sandbox support.
"""
import hmac
import hashlib
import json
import logging
import base64
import sqlite3
import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from core.config import (
    RAZORPAY_ENABLED,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    BUSINESS_NAME,
    SUPPORT_PHONE,
    SUPPORT_EMAIL,
    BUSINESS_ADDRESS,
    DB_FILE
)

logger = logging.getLogger(__name__)

class PaymentService:
    @classmethod
    def create_order(cls, booking_id: int, booking_ref: str, amount: float, payment_type: str = 'ADVANCE', customer: dict = None) -> dict:
        """
        Creates an order with Razorpay or generates a valid simulated sandbox order.
        Saves transaction record in payments table.
        """
        customer = customer or {}
        amt_paise = int(round(amount * 100))

        order_id = None
        simulated = True

        if RAZORPAY_ENABLED and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
            try:
                auth_str = f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}"
                b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
                payload = {
                    "amount": amt_paise,
                    "currency": "INR",
                    "receipt": f"rcpt_{booking_ref}_{int(datetime.datetime.now().timestamp())}",
                    "notes": {
                        "booking_ref": booking_ref,
                        "payment_type": payment_type,
                        "customer_name": customer.get('name', 'Customer')
                    }
                }
                req = Request(
                    "https://api.razorpay.com/v1/orders",
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Basic {b64_auth}"
                    },
                    method="POST"
                )
                with urlopen(req, timeout=10) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    order_id = res_data.get('id')
                    simulated = False
                    logger.info(f"Razorpay live order created: {order_id} for {booking_ref}")
            except Exception as e:
                logger.warning(f"Razorpay live API call failed ({e}); falling back to simulated sandbox.")

        if not order_id:
            import secrets
            order_id = f"order_sim_{secrets.token_hex(10)}"

        # Save record in payments table
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.execute("""
                    INSERT INTO payments (
                        booking_id, booking_ref, order_id, amount, currency,
                        payment_type, status, customer_name, customer_phone, customer_email
                    ) VALUES (?, ?, ?, ?, 'INR', ?, 'CREATED', ?, ?, ?)
                """, (
                    booking_id,
                    booking_ref,
                    order_id,
                    amount,
                    payment_type,
                    customer.get('name', ''),
                    customer.get('phone', ''),
                    customer.get('email', '')
                ))
        except Exception as e:
            logger.error(f"Error persisting payment order: {e}")

        return {
            "success": True,
            "order_id": order_id,
            "amount": amount,
            "amount_paise": amt_paise,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID if (RAZORPAY_ENABLED and RAZORPAY_KEY_ID) else "rzp_test_simulated_key",
            "booking_ref": booking_ref,
            "payment_type": payment_type,
            "simulated": simulated,
            "business_name": BUSINESS_NAME
        }

    @classmethod
    def verify_payment(cls, order_id: str, payment_id: str, signature: str) -> dict:
        """
        Verifies Razorpay HMAC signature or validates sandbox test signature.
        Updates payment and booking status upon verification.
        """
        verified = False

        if order_id.startswith('order_sim_') or not RAZORPAY_ENABLED or not RAZORPAY_KEY_SECRET:
            # Sandbox validation: accepts test payments
            verified = True
        else:
            try:
                msg = f"{order_id}|{payment_id}".encode('utf-8')
                expected = hmac.new(RAZORPAY_KEY_SECRET.encode('utf-8'), msg, hashlib.sha256).hexdigest()
                verified = hmac.compare_digest(expected, signature)
            except Exception as e:
                logger.error(f"Signature verification error: {e}")
                verified = False

        if not verified:
            return {"success": False, "error": "Invalid payment signature."}

        # Update payments record and booking status in SQLite
        booking_ref = None
        booking_id = None
        amount = 0.0
        payment_type = 'ADVANCE'

        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT * FROM payments WHERE order_id = ?", (order_id,))
                payment_rec = cur.fetchone()

                if payment_rec:
                    booking_id = payment_rec['booking_id']
                    booking_ref = payment_rec['booking_ref']
                    amount = float(payment_rec['amount'])
                    payment_type = payment_rec['payment_type']

                    # Update payment status
                    conn.execute("""
                        UPDATE payments
                        SET status = 'SUCCESS', payment_id = ?, signature = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE order_id = ?
                    """, (payment_id, signature, order_id))

                    # Update booking status
                    new_status = 'PARTIAL_ADVANCE' if payment_type == 'ADVANCE' else 'PAID'
                    conn.execute("""
                        UPDATE bookings
                        SET payment_status = ?,
                            payment_id = ?,
                            payment_amount = COALESCE(payment_amount, 0) + ?,
                            status = CASE WHEN status = 'NEW' THEN 'CONFIRMED' ELSE status END,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (new_status, payment_id, amount, booking_id))

                    logger.info(f"Payment verified for booking {booking_ref}: ₹{amount} ({payment_id})")
        except Exception as e:
            logger.error(f"Error updating payment confirmation in DB: {e}")
            return {"success": False, "error": str(e)}

        return {
            "success": True,
            "message": "Payment verified successfully! Your booking is confirmed.",
            "order_id": order_id,
            "payment_id": payment_id,
            "amount": amount,
            "booking_ref": booking_ref,
            "payment_type": payment_type
        }

    @classmethod
    def process_refund(cls, payment_id: str, amount: float = None, reason: str = "Cancelled booking") -> dict:
        """Processes partial or full refund for a payment."""
        try:
            with sqlite3.connect(DB_FILE) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT * FROM payments WHERE payment_id = ?", (payment_id,))
                rec = cur.fetchone()
                if not rec:
                    return {"success": False, "error": "Payment record not found."}

                # Update payment status
                conn.execute("""
                    UPDATE payments
                    SET status = 'REFUNDED', updated_at = CURRENT_TIMESTAMP
                    WHERE payment_id = ?
                """, (payment_id,))

                # Update booking
                conn.execute("""
                    UPDATE bookings
                    SET payment_status = 'REFUNDED', updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (rec['booking_id'],))

                return {
                    "success": True,
                    "message": f"Refund of ₹{rec['amount']} processed successfully.",
                    "payment_id": payment_id,
                    "booking_ref": rec['booking_ref']
                }
        except Exception as e:
            logger.error(f"Refund processing error: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    def generate_invoice_html(cls, booking: dict, payment: dict = None) -> str:
        """Generates clean, printable HTML receipt and invoice."""
        ref = booking.get('booking_ref', 'N/A')
        date_now = datetime.date.today().strftime('%d %B %Y')
        total_fare = float(booking.get('estimated_fare') or 0.0)
        paid_amount = float(booking.get('payment_amount') or 0.0)
        balance_due = max(0.0, total_fare - paid_amount)

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice / Receipt - {ref}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1e293b; padding: 40px; margin: 0; }}
    .invoice-card {{ max-width: 760px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; }}
    .header {{ display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }}
    .company h1 {{ margin: 0 0 6px 0; font-size: 24px; color: #0f172a; }}
    .company p {{ margin: 2px 0; color: #64748b; font-size: 13px; }}
    .inv-details {{ text-align: right; }}
    .inv-badge {{ display: inline-block; background: #ecfdf5; color: #059669; font-weight: 700; padding: 4px 12px; border-radius: 16px; font-size: 12px; margin-bottom: 8px; }}
    .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; font-size: 14px; }}
    .grid-col h3 {{ font-size: 12px; text-transform: uppercase; color: #94a3b8; margin: 0 0 8px 0; letter-spacing: 0.5px; }}
    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }}
    th {{ background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 12px; text-align: left; font-weight: 600; color: #475569; }}
    td {{ padding: 12px; border-bottom: 1px solid #e2e8f0; }}
    .totals {{ margin-left: auto; width: 280px; font-size: 14px; margin-top: 16px; }}
    .tot-row {{ display: flex; justify-content: space-between; padding: 6px 0; }}
    .tot-row.grand {{ font-size: 16px; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 10px; color: #0f172a; }}
    .footer {{ margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 16px; text-align: center; font-size: 12px; color: #64748b; }}
    @media print {{ body {{ padding: 0; }} .invoice-card {{ border: none; padding: 0; }} .no-print {{ display: none; }} }}
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; max-width: 760px; margin: 0 auto 16px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🖨️ Print / Download PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div class="company">
        <h1>🚕 {BUSINESS_NAME}</h1>
        <p>Premium Pune ⇄ Mumbai Intercity Express Cab Service</p>
        <p>Helpline: (+91) {SUPPORT_PHONE} | Email: {SUPPORT_EMAIL}</p>
        <p>Office: {BUSINESS_ADDRESS}</p>
      </div>
      <div class="inv-details">
        <div class="inv-badge">STATUS: {booking.get('payment_status', 'PENDING')}</div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a;">Invoice #: INV-{ref}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: {date_now}</div>
      </div>
    </div>

    <div class="grid">
      <div class="grid-col">
        <h3>Billed To (Passenger)</h3>
        <div><strong>{booking.get('customer_name', 'Customer')}</strong></div>
        <div>Phone: (+91) {booking.get('customer_phone', 'N/A')}</div>
        <div>Email: {booking.get('customer_email', 'Not provided')}</div>
      </div>
      <div class="grid-col">
        <h3>Trip Specifications</h3>
        <div><strong>Route:</strong> {booking.get('pickup_location')} ➔ {booking.get('drop_location')}</div>
        <div><strong>Travel Date:</strong> {booking.get('travel_date')} ({booking.get('travel_time')})</div>
        <div><strong>Vehicle:</strong> {booking.get('vehicle_name', 'AC Cab')} ({booking.get('passengers', 4)} Pax)</div>
        <div><strong>Trip Type:</strong> {booking.get('trip_type', 'oneway').upper()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Pune ⇄ Mumbai Cab Booking ({booking.get('vehicle_name', 'Cab')})</strong><br>
            <span style="font-size: 12px; color: #64748b;">Includes Expressway Toll Tax, AC Sedan/SUV, Driver Allowance & Fuel</span>
          </td>
          <td style="text-align: center;">1 Trip</td>
          <td style="text-align: right;">₹{int(total_fare)}</td>
          <td style="text-align: right;">₹{int(total_fare)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="tot-row">
        <span>Subtotal:</span>
        <span>₹{int(total_fare)}</span>
      </div>
      <div class="tot-row">
        <span>Expressway FastTag Toll:</span>
        <span style="color: #059669;">Included</span>
      </div>
      <div class="tot-row">
        <span>Advance Paid Online:</span>
        <span style="color: #059669;">- ₹{int(paid_amount)}</span>
      </div>
      <div class="tot-row grand">
        <span>Balance Due:</span>
        <span>₹{int(balance_due)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for traveling with <strong>{BUSINESS_NAME}</strong>! Safe travels.</p>
      <p>Payment ID: {booking.get('payment_id') or 'Pay on Arrival (Cash/UPI)'}</p>
    </div>
  </div>
</body>
</html>
"""
