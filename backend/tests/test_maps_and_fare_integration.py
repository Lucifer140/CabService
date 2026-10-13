"""
Integration Test Suite: Google Maps, Distance Matrix, Toll & Authoritative Cab Fare Calculation
Sangita Travels Pune Cab Management System
"""

import os
import sys
import json
import unittest
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.maps_service import MapsService
from repositories.pricing_repository import PricingRepository
from repositories.booking_repository import BookingRepository
from repositories.audit_repository import AuditRepository


class TestMapsAndFareIntegration(unittest.TestCase):
    BASE_URL = "http://127.0.0.1:8080"

    def _post(self, path: str, payload: dict):
        url = f"{self.BASE_URL}{path}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "MapsIntegrationTest/1.0"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                return res.status, json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode("utf-8"))

    def _get(self, path: str):
        url = f"{self.BASE_URL}{path}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "MapsIntegrationTest/1.0"},
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                return res.status, json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode("utf-8"))

    def test_01_pune_to_mumbai_distance_and_toll(self):
        """Test Pune to Mumbai Expressway corridor (152 km, ~3h 15m, ₹320 toll)."""
        route = MapsService.calculate_distance("Pune", "Mumbai")
        self.assertIsNotNone(route)
        self.assertEqual(route["distance_km"], 152.0)
        self.assertIn("Expressway", route["duration_text"])
        self.assertEqual(route["toll_amount"], 320.0)
        self.assertTrue(route["toll_available"])
        self.assertIn("320", route["toll_display"])

        # Also check Airport destination (160 km, ₹320 toll)
        route_airport = MapsService.calculate_distance("Pune Station", "Mumbai Airport T2")
        self.assertEqual(route_airport["distance_km"], 160.0)
        self.assertEqual(route_airport["toll_amount"], 320.0)

    def test_02_pune_to_nashik_distance_and_toll(self):
        """Test Pune to Nashik NH60 highway corridor (212 km, ~4h 30m, ₹190 toll)."""
        route = MapsService.calculate_distance("Pune Swargate", "Nashik City")
        self.assertIsNotNone(route)
        self.assertEqual(route["distance_km"], 212.0)
        self.assertIn("4h", route["duration_text"])
        self.assertEqual(route["toll_amount"], 190.0)
        self.assertTrue(route["toll_available"])
        self.assertIn("190", route["toll_display"])

    def test_03_swift_dzire_vs_ertiga_fare_calculation(self):
        """Compare Swift Dzire vs Maruti Ertiga authoritative fare breakdowns."""
        dzire_rule = PricingRepository.get_by_vehicle_key("dzire")
        ertiga_rule = PricingRepository.get_by_vehicle_key("ertiga")

        self.assertIsNotNone(dzire_rule)
        self.assertIsNotNone(ertiga_rule)

        dzire_fare = MapsService.compute_fare_breakdown(
            "Pune", "Mumbai", dzire_rule, trip_type="oneway"
        )
        ertiga_fare = MapsService.compute_fare_breakdown(
            "Pune", "Mumbai", ertiga_rule, trip_type="oneway"
        )

        # Both include road distance and expressway toll
        self.assertEqual(dzire_fare["distance_km"], 152.0)
        self.assertEqual(dzire_fare["toll_amount"], 320.0)
        self.assertEqual(ertiga_fare["toll_amount"], 320.0)

        # Ertiga is a 6-seater MUV, fare must be higher than Dzire 4-seater Sedan
        self.assertGreater(ertiga_fare["total_fare"], dzire_fare["total_fare"])
        self.assertGreaterEqual(dzire_fare["total_fare"], 2299)
        self.assertGreaterEqual(ertiga_fare["total_fare"], 3199)

    def test_04_roundtrip_pricing_rules(self):
        """Test roundtrip calculation doubles distance (min 300km) and doubles tolls."""
        dzire_rule = PricingRepository.get_by_vehicle_key("dzire")
        rt_calc = MapsService.compute_fare_breakdown(
            "Pune", "Mumbai", dzire_rule, trip_type="roundtrip"
        )

        self.assertEqual(rt_calc["trip_type"], "roundtrip")
        # 152km * 2 = 304km billed
        self.assertEqual(rt_calc["billed_km"], 304.0)
        # 2x tolls = ₹640
        self.assertEqual(rt_calc["toll_charge"], 640.0)
        self.assertGreaterEqual(rt_calc["total_fare"], dzire_rule["roundtrip_base"])

    def test_05_toll_unavailable_scenario(self):
        """Intra-city or non-toll route reports toll estimate unavailable gracefully."""
        route = MapsService.calculate_distance("Kothrud, Pune", "Hinjewadi Phase 1, Pune")
        self.assertIsNotNone(route)
        self.assertEqual(route["toll_amount"], 0.0)
        self.assertFalse(route["toll_available"])
        self.assertEqual(route["toll_display"], "Toll estimate unavailable")

    def test_06_missing_and_identical_locations_validation(self):
        """Backend rejects missing or identical pickup and drop with HTTP 400."""
        # 1. Missing locations on GET /api/public/route-distance
        status, body = self._get("/api/public/route-distance?pickup=&drop=")
        self.assertEqual(status, 400)
        self.assertIn("required", body.get("error", "").lower())

        # 2. Identical locations on GET /api/public/route-distance
        status, body = self._get("/api/public/route-distance?pickup=Pune&drop=Pune")
        self.assertEqual(status, 400)
        self.assertIn("identical", body.get("error", "").lower())

        # 3. Identical locations on POST /api/public/calculate-fare
        status, body = self._post("/api/public/calculate-fare", {
            "pickup": "Mumbai Airport",
            "drop": "Mumbai Airport",
            "vehicle": "dzire",
        })
        self.assertEqual(status, 400)
        self.assertIn("identical", body.get("error", "").lower())

    def test_07_authoritative_fare_recalculation_and_quotation_snapshot(self):
        """
        When creating booking, server NEVER trusts browser fare.
        Recalculates authoritative fare and persists snapshot with distance, duration, and toll.
        """
        unique_phone = f"9988{int(datetime.now().timestamp()) % 1000000:06d}"
        payload = {
            "name": "Integration Test Customer",
            "phone": unique_phone,
            "email": "testcustomer@sangitatravels.com",
            "pickup": "Pune",
            "drop": "Mumbai",
            "date": "2026-10-25",
            "time": "07:00 AM",
            "trip_type": "oneway",
            "vehicle": "dzire",
            "passengers": 4,
            "fare": 50,  # Tampered intentionally low browser value
        }

        status, body = self._post("/api/bookings", payload)
        self.assertEqual(status, 201)
        self.assertTrue(body.get("success"))
        self.assertTrue(body.get("booking_ref"))

        ref = body["booking_ref"]
        booking = BookingRepository.get_by_ref(ref)
        self.assertIsNotNone(booking)

        # Fare must NOT be the client's tampered ₹50
        fare_value = booking.get("estimated_fare") or booking.get("fare", 0)
        self.assertGreater(fare_value, 2000)
        self.assertEqual(booking["distance_km"], 152.0)
        self.assertIn("Expressway", booking["duration_text"])
        self.assertEqual(booking["toll_amount"], 320.0)

        # Quotation snapshot verification
        self.assertTrue(booking["quotation_snapshot"])
        snapshot = json.loads(booking["quotation_snapshot"])
        self.assertEqual(snapshot["route"], "Pune ➔ Mumbai")
        self.assertEqual(snapshot["distance_km"], 152.0)
        self.assertEqual(snapshot["toll_amount"], 320.0)
        self.assertIn("quotation_timestamp", snapshot)
        self.assertGreater(snapshot["final_fare"], 2000)


if __name__ == "__main__":
    unittest.main()
