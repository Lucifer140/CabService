"""
Coupon & Discount Controller
"""
from core.response import send_json, send_error, read_json_body, get_client_ip
from repositories.coupon_repository import CouponRepository
from repositories.audit_repository import AuditRepository

class CouponController:
    @staticmethod
    def validate_public_coupon(handler):
        body = read_json_body(handler)
        code = body.get('code', '').strip()
        fare = float(body.get('fare', 0.0))

        if not code:
            return send_error(handler, "Coupon code is required.", status=400)

        result = CouponRepository.validate_coupon(code, fare)
        if not result.get('valid'):
            return send_json(handler, {
                "success": False,
                "valid": False,
                "discount": 0,
                "message": result.get('message', 'Invalid coupon')
            }, status=200)

        return send_json(handler, {
            "success": True,
            "valid": True,
            **result
        })

    @staticmethod
    def list_coupons(handler):
        coupons = CouponRepository.list_all()
        return send_json(handler, {"success": True, "coupons": coupons, "count": len(coupons)})

    @staticmethod
    def create_coupon(handler, user: dict):
        body = read_json_body(handler)
        code = body.get('code', '').strip().upper()
        c_type = body.get('type', 'percentage').strip().lower()
        value = float(body.get('value', 0))

        if not code:
            return send_error(handler, "Coupon code is required.", status=400)
        if value <= 0:
            return send_error(handler, "Coupon value must be greater than 0.", status=400)

        existing = CouponRepository.get_by_code(code)
        if existing:
            return send_error(handler, f"Coupon code '{code}' already exists.", status=409)

        coupon_id = CouponRepository.create(body)
        AuditRepository.log(user['id'], user['username'], 'CREATE_COUPON', 'coupons', f"Created coupon {code} ({c_type} {value})", get_client_ip(handler))
        new_coupon = CouponRepository.get_by_id(coupon_id)
        return send_json(handler, {
            "success": True,
            "message": f"Coupon '{code}' created successfully.",
            "coupon": new_coupon
        }, status=201)

    @staticmethod
    def update_coupon(handler, coupon_id: int, user: dict):
        coupon = CouponRepository.get_by_id(coupon_id)
        if not coupon:
            return send_error(handler, "Coupon not found.", status=404)

        body = read_json_body(handler)
        CouponRepository.update(coupon_id, body)
        AuditRepository.log(user['id'], user['username'], 'UPDATE_COUPON', 'coupons', f"Updated coupon {coupon['code']} (ID {coupon_id})", get_client_ip(handler))
        updated = CouponRepository.get_by_id(coupon_id)
        return send_json(handler, {
            "success": True,
            "message": "Coupon updated successfully.",
            "coupon": updated
        })

    @staticmethod
    def delete_coupon(handler, coupon_id: int, user: dict):
        coupon = CouponRepository.get_by_id(coupon_id)
        if not coupon:
            return send_error(handler, "Coupon not found.", status=404)

        CouponRepository.delete(coupon_id)
        AuditRepository.log(user['id'], user['username'], 'DELETE_COUPON', 'coupons', f"Deleted coupon {coupon['code']} (ID {coupon_id})", get_client_ip(handler))
        return send_json(handler, {"success": True, "message": f"Coupon '{coupon['code']}' deleted."})
