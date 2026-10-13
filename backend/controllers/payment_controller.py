"""
Payment Management Controller
Handles order creation, Razorpay HMAC signature verification, advance token deposits,
and invoice receipt rendering.
"""
from core.response import send_json, send_error, send_html, read_json_body, get_client_ip
from repositories.booking_repository import BookingRepository
from repositories.audit_repository import AuditRepository
from services.payment_service import PaymentService

class PaymentController:
    @staticmethod
    def create_order(handler):
        body = read_json_body(handler)
        booking_id = body.get('booking_id')
        booking_ref = body.get('booking_ref', '')
        payment_type = body.get('payment_type', 'ADVANCE').upper()  # 'ADVANCE' or 'FULL'

        booking = None
        if booking_id:
            booking = BookingRepository.get_by_id(int(booking_id))
        elif booking_ref:
            # find by ref
            all_b = BookingRepository.list_all(limit=100)
            for b in all_b:
                if b.get('booking_ref') == booking_ref:
                    booking = b
                    break

        if not booking:
            return send_error(handler, "Booking reference not found.", status=404)

        fare = float(booking.get('estimated_fare') or 2299.0)
        # Advance token is ₹500 or specified amount
        amount = 500.0 if payment_type == 'ADVANCE' else fare
        if 'custom_amount' in body and float(body['custom_amount']) > 0:
            amount = float(body['custom_amount'])

        customer = {
            "name": booking.get('customer_name', ''),
            "phone": booking.get('customer_phone', ''),
            "email": booking.get('customer_email', '')
        }

        order_res = PaymentService.create_order(
            booking_id=booking['id'],
            booking_ref=booking['booking_ref'],
            amount=amount,
            payment_type=payment_type,
            customer=customer
        )

        return send_json(handler, order_res, status=201)

    @staticmethod
    def verify_payment(handler):
        body = read_json_body(handler)
        order_id = body.get('order_id') or body.get('razorpay_order_id')
        payment_id = body.get('payment_id') or body.get('razorpay_payment_id')
        signature = body.get('signature') or body.get('razorpay_signature') or 'sim_sig_valid'

        if not order_id or not payment_id:
            return send_error(handler, "Order ID and Payment ID are required.", status=400)

        verify_res = PaymentService.verify_payment(order_id, payment_id, signature)
        if not verify_res.get('success'):
            return send_error(handler, verify_res.get('error', 'Payment verification failed'), status=400)

        return send_json(handler, verify_res)

    @staticmethod
    def get_invoice(handler, booking_id: int):
        booking = BookingRepository.get_by_id(booking_id)
        if not booking:
            return send_error(handler, "Booking not found", status=404)

        html = PaymentService.generate_invoice_html(booking)
        return send_html(handler, html)

    @staticmethod
    def refund_payment(handler, user: dict):
        body = read_json_body(handler)
        payment_id = body.get('payment_id', '').strip()
        reason = body.get('reason', 'Cancelled booking')

        if not payment_id:
            return send_error(handler, "Payment ID is required for refund", status=400)

        res = PaymentService.process_refund(payment_id, reason=reason)
        if not res.get('success'):
            return send_error(handler, res.get('error', 'Refund failed'), status=400)

        AuditRepository.log(user['id'], user['username'], 'REFUND_PAYMENT', 'payments', f"Refunded {payment_id}", get_client_ip(handler))
        return send_json(handler, res)
