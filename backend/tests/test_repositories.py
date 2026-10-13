"""
Unit Tests for Database Repositories
Tests Repository pattern implementations against isolated SQLite database.
"""

import os
import sys
import unittest
import tempfile

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import core.config
import core.database
import migrate
from core.security import verify_password
from repositories.user_repository import UserRepository
from repositories.vehicle_repository import VehicleRepository
from repositories.tour_repository import TourRepository
from repositories.pricing_repository import PricingRepository
from repositories.booking_repository import BookingRepository
from repositories.customer_repository import CustomerRepository
from repositories.seo_repository import SeoRepository
from repositories.audit_repository import AuditRepository


class TestRepositories(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_db_fd, cls.temp_db_path = tempfile.mkstemp(suffix="_test_cab.db")
        os.close(cls.temp_db_fd)
        
        cls.original_db_path = core.config.DB_FILE
        core.config.DB_FILE = cls.temp_db_path
        core.database.DB_FILE = cls.temp_db_path

        migrate.run_migration(cls.temp_db_path)

    @classmethod
    def tearDownClass(cls):
        core.config.DB_FILE = cls.original_db_path
        core.database.DB_FILE = cls.original_db_path
        if os.path.exists(cls.temp_db_path):
            try:
                os.remove(cls.temp_db_path)
            except Exception:
                pass

    def test_01_user_repository_and_lockout(self):
        # Verify seeded admin exists
        admin = UserRepository.get_by_identifier('admin')
        self.assertIsNotNone(admin)
        self.assertEqual(admin['role'], 'SUPER_ADMIN')

        # Test password verification
        self.assertTrue(verify_password('admin123', admin['password_hash'], admin['password_salt']))
        self.assertFalse(verify_password('wrongpass', admin['password_hash'], admin['password_salt']))

        # Test failed attempts tracking
        user_id = admin['id']
        UserRepository.record_failed_attempt(user_id, 1)
        refreshed = UserRepository.get_by_id(user_id)
        self.assertEqual(refreshed['failed_attempts'], 1)

        # Reset failed attempts
        UserRepository.reset_failed_attempts(user_id)
        refreshed2 = UserRepository.get_by_id(user_id)
        self.assertEqual(refreshed2['failed_attempts'], 0)

        # Test session creation and validation
        import datetime
        import secrets
        token = secrets.token_hex(16)
        expires = (datetime.datetime.now() + datetime.timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')
        UserRepository.create_session(token, user_id, '127.0.0.1', 'Unit-Test', expires)
        session_user = UserRepository.get_session_user(token)
        self.assertIsNotNone(session_user)
        self.assertEqual(session_user['username'], 'admin')

    def test_02_vehicle_repository_crud(self):
        v_id = VehicleRepository.create({
            'vehicle_key': 'test_sedan',
            'name': 'Test Luxury Sedan',
            'category': 'Sedan',
            'passenger_capacity': 4,
            'luggage_capacity': '3 Bags',
            'pricing_per_km': 13.5,
            'pricing_base': 2500,
            'description': 'Test vehicle description',
            'image_url': 'assets/images/dzire.png',
            'display_order': 99
        })
        self.assertIsNotNone(v_id)

        veh = VehicleRepository.get_by_key('test_sedan')
        self.assertIsNotNone(veh)
        self.assertEqual(veh['passenger_capacity'], 4)

        VehicleRepository.update('test_sedan', {
            'name': 'Updated Luxury Sedan',
            'category': 'Sedan',
            'passenger_capacity': 4,
            'luggage_capacity': '3 Bags',
            'description': 'Updated',
            'image_url': 'assets/images/dzire.png',
            'pricing_per_km': 14.0,
            'pricing_base': 2600,
            'status': 'AVAILABLE',
            'is_active': 1,
            'display_order': 99
        })
        updated = VehicleRepository.get_by_key('test_sedan')
        self.assertEqual(updated['name'], 'Updated Luxury Sedan')
        self.assertEqual(updated['pricing_per_km'], 14.0)

        all_v = VehicleRepository.list_all()
        self.assertTrue(any(v['vehicle_key'] == 'test_sedan' for v in all_v))

        VehicleRepository.delete('test_sedan')
        self.assertIsNone(VehicleRepository.get_by_key('test_sedan'))


    def test_03_tour_repository_crud(self):
        t_id = TourRepository.create({
            'title': 'Test Lonavala Day Tour',
            'slug': 'test-lonavala-tour',
            'destination': 'Lonavala',
            'duration': '1 Day',
            'price': 2999.0,
            'itinerary': 'Visit Tiger Point and Bhushi Dam.',
            'inclusions': 'AC Cab, Toll, Parking',
            'exclusions': 'Entry Tickets, Food',
            'cover_image': 'assets/images/tours/lonavala.jpg',
            'is_published': 1,
            'display_order': 10
        })
        self.assertIsNotNone(t_id)

        tour = TourRepository.get_by_slug('test-lonavala-tour')
        self.assertIsNotNone(tour)
        self.assertEqual(tour['price'], 2999.0)

        TourRepository.update(t_id, {
            'title': 'Test Lonavala Day Tour',
            'slug': 'test-lonavala-tour',
            'destination': 'Lonavala',
            'duration': '1 Day',
            'price': 3200.0,
            'itinerary': 'Updated itinerary',
            'inclusions': 'AC Cab',
            'exclusions': 'Food',
            'cover_image': 'assets/images/tours/lonavala.jpg',
            'is_published': 1,
            'display_order': 10
        })
        self.assertEqual(TourRepository.get_by_id(t_id)['price'], 3200.0)

        TourRepository.delete(t_id)
        self.assertIsNone(TourRepository.get_by_slug('test-lonavala-tour'))

    def test_04_pricing_rules(self):
        rules = PricingRepository.list_all()
        self.assertTrue(len(rules) > 0)
        
        dzire_rule = PricingRepository.get_by_vehicle_key('dzire')
        self.assertIsNotNone(dzire_rule)
        self.assertGreater(dzire_rule['per_km'], 0)
        self.assertGreater(dzire_rule['oneway_pune_mumbai'], 0)

    def test_05_booking_and_customer_repository(self):
        c_id = CustomerRepository.get_or_create(
            name='Rohit Sharma',
            phone='9890123456',
            email='rohit@example.com'
        )
        self.assertIsNotNone(c_id)

        booking = BookingRepository.create({
            'customer_name': 'Rohit Sharma',
            'customer_phone': '9890123456',
            'customer_email': 'rohit@example.com',
            'vehicle_key': 'dzire',
            'vehicle_name': 'Swift Dzire',
            'trip_type': 'oneway',
            'pickup_location': 'Kothrud, Pune',
            'drop_location': 'Mumbai Airport T2',
            'travel_date': '2026-10-25',
            'travel_time': '08:00 AM',
            'estimated_fare': 2299.0,
            'status': 'NEW',
            'customer_notes': 'Need clean car with luggage space'
        })
        self.assertIsNotNone(booking)
        b_id = booking['id']

        fetched = BookingRepository.get_by_id(b_id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched['pickup_location'], 'Kothrud, Pune')
        self.assertEqual(fetched['estimated_fare'], 2299.0)

        BookingRepository.update_status(b_id, 'CONFIRMED')
        updated = BookingRepository.get_by_id(b_id)
        self.assertEqual(updated['status'], 'CONFIRMED')

    def test_06_seo_repository(self):
        SeoRepository.update_page('test-page', {
            'title': 'Test Pune Cab Service',
            'meta_description': 'Reliable 24x7 cab service between Pune and Mumbai.',
            'keywords': 'pune cab, mumbai taxi',
            'og_title': 'Test OG Title',
            'og_description': 'Test OG Description',
            'og_image': 'assets/images/dzire.png',
            'canonical_url': 'https://sangitatravelspune.com/test'
        })
        meta = SeoRepository.get_by_page('test-page')
        self.assertIsNotNone(meta)
        self.assertEqual(meta['title'], 'Test Pune Cab Service')

    def test_07_audit_logging(self):
        admin = UserRepository.get_by_identifier('admin')
        AuditRepository.log(
            user_id=admin['id'],
            user_name=admin['username'],
            action='TEST_ACTION',
            resource='test',
            details='Unit test audit trail entry',
            ip_address='127.0.0.1'
        )
        recent = AuditRepository.list_logs(limit=10)
        self.assertTrue(any(log['action'] == 'TEST_ACTION' for log in recent))

    def test_08_reviews_repository(self):
        from repositories.review_repository import ReviewRepository
        r_id = ReviewRepository.create({
            'customer_name': 'Test Reviewer',
            'customer_phone': '9890123456',
            'rating': 5,
            'review_text': 'Fabulous journey and great chauffeur!',
            'trip_ref': 'PTC-9999',
            'route': 'Pune to Mumbai Airport',
            'is_approved': 1
        })
        self.assertIsNotNone(r_id)

        approved = ReviewRepository.list_approved(limit=10)
        self.assertTrue(any(r['customer_name'] == 'Test Reviewer' for r in approved))

        stats = ReviewRepository.get_stats()
        self.assertGreater(stats['total_reviews'], 0)
        self.assertGreaterEqual(stats['average_rating'], 4.0)

        ReviewRepository.update_approval(r_id, 0)
        approved_after = ReviewRepository.list_approved(limit=10)
        self.assertFalse(any(r['id'] == r_id for r in approved_after))

    def test_09_booking_track_lookup(self):
        booking = BookingRepository.create({
            'customer_name': 'Tracking Test User',
            'customer_phone': '9822998877',
            'pickup_location': 'Aundh, Pune',
            'drop_location': 'Bandra, Mumbai',
            'travel_date': '2026-11-01',
            'vehicle_key': 'dzire',
            'vehicle_name': 'Swift Dzire',
            'estimated_fare': 2499.0,
            'status': 'CONFIRMED'
        })
        self.assertIsNotNone(booking)
        ref = booking['booking_ref']

        # Lookup by exact ref and phone
        tracked = BookingRepository.get_by_ref_and_phone(ref, '9822998877')
        self.assertIsNotNone(tracked)
        self.assertEqual(tracked['booking_ref'], ref)
        self.assertEqual(tracked['status'], 'CONFIRMED')

        # Lookup with non-matching phone should return None
        none_result = BookingRepository.get_by_ref_and_phone(ref, '9111111111')
        self.assertIsNone(none_result)


if __name__ == '__main__':
    unittest.main()
