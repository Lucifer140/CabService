"""
API Integration & Security Tests
Tests live API endpoints over HTTP against the server.
"""

import json
import urllib.request
import os
import sys
import urllib.error
import unittest
from typing import Optional

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from core.database import transaction
from core.security import hash_password

BASE_URL = "http://127.0.0.1:8080"

class TestApiIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with transaction() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id FROM admins WHERE username = 'admin';")
            row = cur.fetchone()
            if not row:
                pwd_hash, salt = hash_password("admin123")
                cur.execute("""
                    INSERT INTO admins (username, password_hash, password_salt, full_name, phone, email, role, is_active)
                    VALUES ('admin', ?, ?, 'API Test Admin', '9999999999', 'testadmin@sangitatravels.com', 'SUPER_ADMIN', 1)
                """, (pwd_hash, salt))

    @classmethod
    def tearDownClass(cls):
        with transaction() as conn:
            conn.execute("DELETE FROM admins WHERE username = 'admin' AND email = 'testadmin@sangitatravels.com';")
    def _make_request(self, path: str, method: str = "GET", data: Optional[dict] = None, headers: Optional[dict] = None):
        url = f"{BASE_URL}{path}"
        req_headers = {"Origin": "http://localhost:5173"}
        if headers:
            req_headers.update(headers)

        body = None
        if data is not None:
            body = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.status
                resp_headers = dict(response.headers)
                resp_body = json.loads(response.read().decode("utf-8"))
                return status, resp_headers, resp_body
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
            except Exception:
                err_body = {"error": str(e)}
            return e.code, dict(e.headers), err_body

    def test_01_public_site_data(self):
        status, headers, body = self._make_request("/api/public/site-data")
        self.assertEqual(status, 200)
        self.assertTrue(body.get("success"))
        self.assertIn("fleet", body)
        self.assertIn("tours", body)
        self.assertIn("pricing", body)
        self.assertIn("X-Request-ID", headers)

    def test_02_public_fleet_and_pricing(self):
        status, _, body = self._make_request("/api/public/fleet")
        self.assertEqual(status, 200)
        self.assertTrue(len(body.get("vehicles", [])) > 0)

        status, _, pricing_body = self._make_request("/api/public/pricing")
        self.assertEqual(status, 200)
        self.assertTrue(len(pricing_body.get("pricing", [])) > 0)

    created_booking_id = None

    def test_03_route_distance_and_calculate_fare(self):
        status, _, body = self._make_request("/api/public/route-distance?pickup=Pune&drop=Mumbai%20Airport%20T2")
        self.assertEqual(status, 200)
        self.assertGreater(body.get("route", {}).get("distance_km", 0), 100)

        status, _, fare_body = self._make_request("/api/public/calculate-fare", method="POST", data={
            "pickup": "Pune Station",
            "drop": "Dadar, Mumbai",
            "vehicle_key": "dzire",
            "trip_type": "oneway"
        })
        self.assertEqual(status, 200)
        self.assertGreater(fare_body.get("pricing", {}).get("estimated_fare", 0), 1500)

    def test_04_create_public_booking(self):
        status, _, body = self._make_request("/api/bookings", method="POST", data={
            "customer_name": "Pooja Kulkarni",
            "customer_phone": "9822334455",
            "customer_email": "pooja@example.com",
            "pickup_location": "Viman Nagar, Pune",
            "drop_location": "Chhatrapati Shivaji Terminus, Mumbai",
            "travel_date": "2026-10-30",
            "travel_time": "09:00 AM",
            "vehicle_key": "ertiga",
            "vehicle_name": "Maruti Ertiga (New MPV)",
            "trip_type": "oneway",
            "estimated_fare": 3199
        })
        self.assertEqual(status, 201)
        self.assertTrue(body.get("success"))
        self.assertIn("booking_ref", body)
        self.assertTrue(body.get("booking_ref", "").startswith("PTC-"))
        TestApiIntegration.created_booking_id = body.get("booking_id")

    def test_05_admin_login_auth_flow(self):
        # Successful login
        status, _, body = self._make_request("/api/login", method="POST", data={
            "username": "admin",
            "password": "admin123"
        })
        self.assertEqual(status, 200)
        self.assertTrue(body.get("success"))
        token = body.get("token")
        self.assertIsNotNone(token)

        # Authenticated dashboard call using token
        status, _, dash_body = self._make_request("/api/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(status, 200)
        self.assertTrue(dash_body.get("success"))

        # Invalid password
        bad_status, _, bad_body = self._make_request("/api/login", method="POST", data={
            "username": "admin",
            "password": "wrong_password"
        })
        self.assertEqual(bad_status, 401)
        self.assertFalse(bad_body.get("success"))

    def test_06_payments_create_and_verify(self):
        booking_id = getattr(TestApiIntegration, 'created_booking_id', None) or 91
        status, _, order_body = self._make_request("/api/payments/create-order", method="POST", data={
            "booking_id": booking_id,
            "amount": 500,
            "payment_type": "token_advance"
        })
        self.assertIn(status, (200, 201))
        self.assertTrue(order_body.get("success"))
        order_id = order_body.get("order_id")


        # Verify payment simulation
        status, _, verify_body = self._make_request("/api/payments/verify", method="POST", data={
            "booking_id": booking_id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_test_unit_12345",
            "razorpay_signature": "simulated_signature",
            "amount": 500
        })
        self.assertEqual(status, 200)
        self.assertTrue(verify_body.get("success"))


    def test_07_csrf_security_untrusted_origin_block(self):
        # Post request from malicious origin must be rejected with 403
        status, _, body = self._make_request(
            "/api/bookings",
            method="POST",
            data={"customer_name": "Hacker"},
            headers={"Origin": "https://malicious-external-site.com"}
        )
        self.assertEqual(status, 403)
        self.assertFalse(body.get("success"))

    def test_08_client_error_logging_endpoint(self):
        status, _, body = self._make_request("/api/public/client-error", method="POST", data={
            "message": "Integration test client exception",
            "url": "http://localhost:8080/#/test"
        })
        self.assertEqual(status, 200)
        self.assertTrue(body.get("logged"))

    def test_09_blog_endpoints(self):
        # Public blog listing
        status, _, body = self._make_request("/api/public/blog")
        self.assertEqual(status, 200)
        self.assertTrue(body.get("success"))
        posts = body.get("posts", [])
        self.assertGreaterEqual(len(posts), 1)

        # Single post by slug
        slug = posts[0]["slug"]
        status, _, post_body = self._make_request(f"/api/public/blog/{slug}")
        self.assertEqual(status, 200)
        self.assertTrue(post_body.get("success"))
        self.assertEqual(post_body["post"]["slug"], slug)


if __name__ == '__main__':
    unittest.main()

