"""
Coupon & Promotional Discount Repository
"""
import datetime
from repositories.base_repository import BaseRepository

class CouponRepository(BaseRepository):
    @classmethod
    def list_all(cls) -> list:
        sql = """
            SELECT id, code, type, value, min_fare, max_discount,
                   valid_from, valid_to, usage_limit, used_count, is_active,
                   created_at, updated_at
            FROM coupons
            ORDER BY is_active DESC, id DESC;
        """
        return cls.query(sql)

    @classmethod
    def get_by_id(cls, coupon_id: int) -> dict:
        sql = "SELECT * FROM coupons WHERE id = ?;"
        return cls.query_one(sql, (coupon_id,))

    @classmethod
    def get_by_code(cls, code: str) -> dict:
        sql = "SELECT * FROM coupons WHERE UPPER(code) = UPPER(?);"
        return cls.query_one(sql, (code.strip(),))

    @classmethod
    def create(cls, data: dict) -> int:
        sql = """
            INSERT INTO coupons (code, type, value, min_fare, max_discount, valid_from, valid_to, usage_limit, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        return cls.execute(sql, (
            data.get('code', '').strip().upper(),
            data.get('type', 'percentage').strip().lower(),
            float(data.get('value', 0)),
            float(data.get('min_fare', 0)),
            float(data.get('max_discount', 0)),
            data.get('valid_from') or None,
            data.get('valid_to') or None,
            int(data.get('usage_limit', 100)),
            int(data.get('is_active', 1))
        ))

    @classmethod
    def update(cls, coupon_id: int, data: dict):
        sql = """
            UPDATE coupons
            SET code = ?, type = ?, value = ?, min_fare = ?, max_discount = ?,
                valid_from = ?, valid_to = ?, usage_limit = ?, is_active = ?,
                updated_at = datetime('now')
            WHERE id = ?;
        """
        cls.execute(sql, (
            data.get('code', '').strip().upper(),
            data.get('type', 'percentage').strip().lower(),
            float(data.get('value', 0)),
            float(data.get('min_fare', 0)),
            float(data.get('max_discount', 0)),
            data.get('valid_from') or None,
            data.get('valid_to') or None,
            int(data.get('usage_limit', 100)),
            int(data.get('is_active', 1)),
            coupon_id
        ))

    @classmethod
    def increment_used_count(cls, coupon_id: int):
        sql = "UPDATE coupons SET used_count = used_count + 1, updated_at = datetime('now') WHERE id = ?;"
        cls.execute(sql, (coupon_id,))

    @classmethod
    def delete(cls, coupon_id: int):
        sql = "DELETE FROM coupons WHERE id = ?;"
        cls.execute(sql, (coupon_id,))

    @classmethod
    def validate_coupon(cls, code: str, fare: float) -> dict:
        if not code or not code.strip():
            return {"valid": False, "discount": 0, "message": "Coupon code cannot be empty."}

        coupon = cls.get_by_code(code)
        if not coupon:
            return {"valid": False, "discount": 0, "message": f"Coupon '{code}' is invalid or does not exist."}

        if not coupon.get('is_active'):
            return {"valid": False, "discount": 0, "message": f"Coupon '{coupon['code']}' is currently inactive."}

        if coupon.get('usage_limit', 0) > 0 and coupon.get('used_count', 0) >= coupon.get('usage_limit', 0):
            return {"valid": False, "discount": 0, "message": f"Coupon '{coupon['code']}' has reached its usage limit."}

        today = datetime.date.today().isoformat()
        if coupon.get('valid_from') and coupon['valid_from'] > today:
            return {"valid": False, "discount": 0, "message": f"Coupon '{coupon['code']}' is not active yet."}
        if coupon.get('valid_to') and coupon['valid_to'] < today:
            return {"valid": False, "discount": 0, "message": f"Coupon '{coupon['code']}' has expired."}

        min_fare = float(coupon.get('min_fare', 0))
        if fare < min_fare:
            return {
                "valid": False,
                "discount": 0,
                "message": f"Coupon '{coupon['code']}' requires a minimum fare of ₹{int(min_fare)} (current: ₹{int(fare)})."
            }

        # Calculate discount
        c_type = coupon.get('type', 'percentage')
        c_val = float(coupon.get('value', 0))
        max_discount = float(coupon.get('max_discount', 0))

        if c_type == 'flat':
            discount = min(c_val, fare)
        else: # percentage
            calculated = fare * (c_val / 100.0)
            discount = min(calculated, max_discount) if max_discount > 0 else calculated

        discount = round(discount, 2)
        final_fare = max(0.0, round(fare - discount, 2))

        return {
            "valid": True,
            "coupon_id": coupon['id'],
            "code": coupon['code'],
            "type": coupon['type'],
            "value": coupon['value'],
            "discount": discount,
            "final_fare": final_fare,
            "message": f"Promo code applied! Saved ₹{discount:g}."
        }
