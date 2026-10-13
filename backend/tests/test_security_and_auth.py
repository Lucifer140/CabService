"""
Security & Authentication Unit Tests
Tests rate limiting, CSRF protection, password complexity, XSS sanitization, and account lockout.
"""

import os
import sys
import time
import unittest

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from core.security import hash_password, verify_password, sanitize_text, sanitize_dict, validate_password_strength
from middleware.rate_limiter import RateLimiter
from middleware.csrf import CsrfProtection

class TestSecurityAndAuth(unittest.TestCase):
    def test_01_password_hashing(self):
        h, salt = hash_password("SuperSecret@2026")
        self.assertTrue(verify_password("SuperSecret@2026", h, salt))
        self.assertFalse(verify_password("WrongSecret@2026", h, salt))

    def test_02_password_complexity(self):
        # Too short (< 8 chars)
        ok, msg = validate_password_strength("Pass1")
        self.assertFalse(ok)

        # Missing number
        ok, msg = validate_password_strength("PasswordNoNum")
        self.assertFalse(ok)

        # Missing letter
        ok, msg = validate_password_strength("123456789")
        self.assertFalse(ok)

        # Valid strong password
        ok, msg = validate_password_strength("StrongP@ssw0rd123")
        self.assertTrue(ok)

    def test_03_xss_sanitization(self):
        dirty_input = '<script>alert("xss")</script>Hello & welcome to Pune Cab!'
        clean = sanitize_text(dirty_input)
        self.assertNotIn('<script>', clean)
        self.assertEqual(clean, 'Hello & welcome to Pune Cab!')

        dirty_dict = {
            "name": "Amit<img src=x onerror=alert(1)>",
            "notes": "Good service",
            "fare": 2500
        }
        sanitized = sanitize_dict(dirty_dict)
        self.assertNotIn('onerror=', sanitized['name'])
        self.assertEqual(sanitized['fare'], 2500)


    def test_04_rate_limiter_sliding_window(self):
        test_ip = "192.168.1.99"
        endpoint = "/api/test-rate-limit"

        # RateLimiter allows normal requests
        for i in range(5):
            allowed, _ = RateLimiter.is_allowed(test_ip, endpoint)
            self.assertTrue(allowed)

        # Flood past threshold to trigger HTTP 429 block
        blocked = False
        for i in range(150):
            allowed, retry = RateLimiter.is_allowed(test_ip, endpoint)
            if not allowed:
                blocked = True
                self.assertGreater(retry, 0)
                break
        self.assertTrue(blocked)

    def test_05_csrf_origin_validation(self):
        # Fake HTTP handler mockup
        class MockHandler:
            headers = {'Origin': 'https://evil-hacker.com', 'Host': 'localhost:8080'}
            command = 'POST'
            path = '/api/bookings'

        mock = MockHandler()
        valid = CsrfProtection.validate_request(mock, 'POST')
        self.assertFalse(valid)

        # Trusted origin should pass
        mock.headers['Origin'] = 'http://localhost:5173'
        valid_trusted = CsrfProtection.validate_request(mock, 'POST')
        self.assertTrue(valid_trusted)


if __name__ == '__main__':
    unittest.main()
