"""
Unit Tests for Google Maps Distance & Dynamic Pricing Engine
"""

import os
import sys
import unittest

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.maps_service import MapsService
from repositories.pricing_repository import PricingRepository

class TestPricingAndMaps(unittest.TestCase):
    def test_01_popular_route_distance(self):
        result = MapsService.calculate_distance("Kothrud, Pune", "Mumbai Airport T2")
        self.assertIsNotNone(result)
        self.assertGreater(result['distance_km'], 100)
        self.assertLess(result['distance_km'], 250)
        self.assertIn("Expressway", result['duration_text'])

    def test_02_dynamic_fare_calculation(self):
        dzire_rule = PricingRepository.get_by_vehicle_key('dzire')
        self.assertIsNotNone(dzire_rule)

        fare_calc = MapsService.compute_fare_breakdown(
            pickup="Pune",
            drop="Mumbai",
            vehicle_rule=dzire_rule,
            trip_type='oneway'
        )
        self.assertIsNotNone(fare_calc)
        self.assertIn('estimated_fare', fare_calc)
        self.assertIn('distance_km', fare_calc)
        self.assertIn('per_km_rate', fare_calc)
        self.assertIn('toll_charge', fare_calc)
        self.assertIn('driver_allowance', fare_calc)

        # Fare should be greater than minimum base
        self.assertGreater(fare_calc['estimated_fare'], 1800)
        self.assertEqual(fare_calc['toll_charge'], 320.0)

    def test_03_roundtrip_fare_calculation(self):
        innova_rule = PricingRepository.get_by_vehicle_key('innova')
        self.assertIsNotNone(innova_rule)

        roundtrip_calc = MapsService.compute_fare_breakdown(
            pickup="Pune",
            drop="Mumbai",
            vehicle_rule=innova_rule,
            trip_type='roundtrip'
        )
        self.assertGreater(roundtrip_calc['estimated_fare'], innova_rule['oneway_pune_mumbai'])
        self.assertEqual(roundtrip_calc['billed_km'], 304.0)


if __name__ == '__main__':
    unittest.main()
