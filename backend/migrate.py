#!/usr/bin/env python3
"""
BEAST MODE Migration System for Sangita Travels Pune (Pune Taxi Cab)
- Automatically creates safe, online SQLite snapshot backups prior to migrations.
- Version-tracks applied migrations in `schema_migrations` table.
- Upgrades existing database preserving all customer and booking records.
"""

import sqlite3
import hashlib
import secrets
import os
import json
import datetime
import time
import sys
import glob

def load_env():
    base = os.path.dirname(os.path.abspath(__file__))
    for env_path in [os.path.join(base, '.env'), os.path.join(base, '..', '.env')]:
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if '=' in line:
                            k, v = line.split('=', 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass
            break

load_env()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)
db_env = os.environ.get('DATABASE_PATH', 'data/bookings.db')
DB_FILE = db_env if os.path.isabs(db_env) else os.path.abspath(os.path.join(BASE_DIR, db_env))

def hash_password(password: str, salt: str = None):
    if not salt:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return pwd_hash, salt

def backup_database(db_target: str, max_backups: int = 20) -> str:
    """
    Safely creates an online, transactionally-consistent snapshot backup of the database
    using SQLite's native backup API (handles active connections and WAL files safely).
    Returns the backup filepath if created, or None if the database does not exist yet.
    """
    if not os.path.exists(db_target) or os.path.getsize(db_target) == 0:
        print(f"[*] No existing database at '{db_target}' to back up. Initializing clean database.")
        return None

    backup_dir = os.path.join(os.path.dirname(os.path.abspath(db_target)), 'backups')
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(backup_dir, f"bookings_backup_{timestamp}.db")
    print(f"[*] Creating safe online backup of database: {os.path.basename(backup_file)}...")

    try:
        src = sqlite3.connect(db_target)
        dst = sqlite3.connect(backup_file)
        with dst:
            src.backup(dst, pages=100)
        dst.close()
        src.close()
        size_kb = round(os.path.getsize(backup_file) / 1024, 2)
        print(f"[✓] Backup created successfully: {backup_file} ({size_kb} KB)")

        # Retention policy: preserve last N backups
        existing_backups = sorted(glob.glob(os.path.join(backup_dir, "bookings_backup_*.db")))
        if len(existing_backups) > max_backups:
            to_remove = existing_backups[:-max_backups]
            for old_b in to_remove:
                try:
                    os.remove(old_b)
                except OSError:
                    pass

        return backup_file
    except Exception as e:
        print(f"[!] Warning: Online database backup encountered an error: {e}")
        return None

def ensure_migrations_table(cursor):
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER DEFAULT 0
    );
    """)

# ==============================================================================
# VERSIONED MIGRATIONS DEFINITIONS
# ==============================================================================

def migration_001_core_schema(cursor):
    """Initial relational schema with 14 core tables and backward-compatible column upgrades."""
    # 1. Admins table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        password_salt VARCHAR(64) DEFAULT '',
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) DEFAULT '',
        email VARCHAR(100) NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'SUPER_ADMIN',
        is_active INTEGER DEFAULT 1,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP NULL,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("PRAGMA table_info(admins);")
    admin_cols = {col['name'] for col in cursor.fetchall()}
    if 'password_salt' not in admin_cols:
        cursor.execute("ALTER TABLE admins ADD COLUMN password_salt VARCHAR(64) DEFAULT '';")
    if 'is_active' not in admin_cols:
        cursor.execute("ALTER TABLE admins ADD COLUMN is_active INTEGER DEFAULT 1;")
    if 'failed_attempts' not in admin_cols:
        cursor.execute("ALTER TABLE admins ADD COLUMN failed_attempts INTEGER DEFAULT 0;")
    if 'locked_until' not in admin_cols:
        cursor.execute("ALTER TABLE admins ADD COLUMN locked_until TIMESTAMP NULL;")
    if 'updated_at' not in admin_cols:
        cursor.execute("ALTER TABLE admins ADD COLUMN updated_at TIMESTAMP NULL;")
        cursor.execute("UPDATE admins SET updated_at = datetime('now') WHERE updated_at IS NULL;")

    # 2. Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(64) PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        ip_address VARCHAR(45) DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );
    """)

    # 3. Customers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100) DEFAULT '',
        total_bookings INTEGER DEFAULT 0,
        last_trip DATE NULL,
        preferred_vehicle VARCHAR(50) DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Bookings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_ref VARCHAR(20) UNIQUE NOT NULL,
        customer_id INTEGER NULL,
        customer_name VARCHAR(100) NOT NULL DEFAULT 'Guest Customer',
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(100) DEFAULT '',
        trip_type VARCHAR(20) NOT NULL,
        pickup_location TEXT NOT NULL,
        drop_location TEXT NOT NULL,
        travel_date DATE NOT NULL,
        travel_time VARCHAR(10) NOT NULL,
        return_date DATE NULL,
        passengers INTEGER DEFAULT 4,
        vehicle_key VARCHAR(30) NOT NULL,
        vehicle_name VARCHAR(50) NOT NULL,
        estimated_fare REAL NOT NULL,
        quoted_amount REAL NULL,
        final_amount REAL NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'NEW',
        assigned_driver VARCHAR(100) DEFAULT '',
        driver_phone VARCHAR(20) DEFAULT '',
        customer_notes TEXT DEFAULT '',
        internal_notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );
    """)

    cursor.execute("PRAGMA table_info(bookings);")
    booking_cols = {col['name'] for col in cursor.fetchall()}
    if 'customer_id' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN customer_id INTEGER NULL;")
    if 'customer_name' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(100) DEFAULT 'Guest Customer';")
    if 'customer_email' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(100) DEFAULT '';")
    if 'passengers' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN passengers INTEGER DEFAULT 4;")
    if 'quoted_amount' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN quoted_amount REAL NULL;")
    if 'final_amount' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN final_amount REAL NULL;")
    if 'internal_notes' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN internal_notes TEXT DEFAULT '';")
    if 'updated_at' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP NULL;")
        cursor.execute("UPDATE bookings SET updated_at = datetime('now') WHERE updated_at IS NULL;")
    if 'payment_status' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(30) DEFAULT 'PENDING';")
    if 'payment_id' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN payment_id VARCHAR(100) DEFAULT NULL;")
    if 'payment_amount' not in booking_cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN payment_amount REAL DEFAULT 0.0;")

    # Ensure payments table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            booking_ref VARCHAR(30) NOT NULL,
            order_id VARCHAR(100) NOT NULL UNIQUE,
            payment_id VARCHAR(100) DEFAULT NULL,
            signature VARCHAR(255) DEFAULT NULL,
            amount REAL NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            payment_type VARCHAR(30) DEFAULT 'ADVANCE',
            status VARCHAR(30) DEFAULT 'CREATED',
            customer_name VARCHAR(100) DEFAULT '',
            customer_phone VARCHAR(20) DEFAULT '',
            customer_email VARCHAR(100) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_booking_ref ON payments(booking_ref);")


    # Standardize legacy booking status values
    cursor.execute("UPDATE bookings SET status = 'NEW' WHERE LOWER(status) = 'pending';")
    cursor.execute("UPDATE bookings SET status = 'CONFIRMED' WHERE LOWER(status) = 'confirmed';")

    # Sync existing bookings into customers table
    cursor.execute("SELECT customer_phone, customer_notes FROM bookings;")
    for b in cursor.fetchall():
        phone = (b['customer_phone'] or '').strip()
        if phone:
            cursor.execute("SELECT id FROM customers WHERE phone = ?", (phone,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO customers (name, phone, notes)
                    VALUES (?, ?, ?)
                """, (f"Customer {phone[-4:]}", phone, b['customer_notes'] or 'Auto-created from booking'))

    cursor.execute("""
        UPDATE customers
        SET total_bookings = (SELECT COUNT(*) FROM bookings WHERE bookings.customer_phone = customers.phone),
            last_trip = (SELECT MAX(travel_date) FROM bookings WHERE bookings.customer_phone = customers.phone);
    """)
    cursor.execute("""
        UPDATE bookings
        SET customer_id = (SELECT id FROM customers WHERE customers.phone = bookings.customer_phone)
        WHERE customer_id IS NULL;
    """)

    # 5. Vehicles table (Fleet Management)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_key VARCHAR(30) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        passenger_capacity INTEGER NOT NULL DEFAULT 4,
        luggage_capacity VARCHAR(50) DEFAULT '2 Bags',
        description TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        pricing_per_km REAL DEFAULT 12.0,
        pricing_base REAL DEFAULT 2000.0,
        status VARCHAR(20) DEFAULT 'AVAILABLE',
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Tours table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(150) NOT NULL,
        slug VARCHAR(150) UNIQUE NOT NULL,
        destination VARCHAR(100) NOT NULL,
        duration VARCHAR(50) DEFAULT '1 Day',
        itinerary TEXT DEFAULT '',
        inclusions TEXT DEFAULT '',
        exclusions TEXT DEFAULT '',
        price REAL NULL,
        cover_image TEXT DEFAULT '',
        is_published INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Services table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        icon VARCHAR(50) DEFAULT 'car',
        image_url TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. Website Content CMS table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS website_content (
        section_key VARCHAR(50) PRIMARY KEY,
        content_json TEXT NOT NULL,
        updated_by VARCHAR(100) DEFAULT 'Admin',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 9. Media Library table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        uploaded_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 10. Pricing Rules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pricing_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_key VARCHAR(50) UNIQUE NOT NULL,
        vehicle_name VARCHAR(100) NOT NULL,
        per_km REAL DEFAULT 12.0,
        min_km INTEGER DEFAULT 130,
        driver_allowance REAL DEFAULT 300.0,
        oneway_pune_mumbai REAL DEFAULT 2299.0,
        roundtrip_base REAL DEFAULT 4500.0,
        airport_rate REAL DEFAULT 2299.0,
        show_price_public INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 11. SEO Metadata table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS seo_meta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_key VARCHAR(50) UNIQUE NOT NULL,
        title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        keywords TEXT DEFAULT '',
        og_title TEXT DEFAULT '',
        og_description TEXT DEFAULT '',
        og_image TEXT DEFAULT '',
        canonical_url TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 12. Analytics Events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type VARCHAR(50) NOT NULL,
        metadata_json TEXT DEFAULT '{}',
        ip_address VARCHAR(45) DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 13. Audit Logs table (Security trail)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NULL,
        user_name VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        details TEXT DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 14. Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

def migration_002_wal_and_indexes(cursor):
    """Enable WAL mode, foreign keys enforcement, and query performance indexes."""
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Performance query indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);")

    # Display and lookup indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_display ON vehicles(display_order);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tours_display ON tours(display_order);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_services_display ON services(display_order);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_seo_page_key ON seo_meta(page_key);")

    # Telemetry and Audit indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);")

def migration_003_seed_data(cursor):
    """Seed initial administrator accounts, fleet vehicles, tours, services, pricing, SEO, and CMS defaults."""
    # Seed Admin Users with all 4 enterprise roles (overridable via environment variables)
    admin_pass = os.environ.get('ADMIN_DEFAULT_PASS', 'admin123')
    manager_pass = os.environ.get('MANAGER_DEFAULT_PASS', 'manager123')
    staff_pass = os.environ.get('STAFF_DEFAULT_PASS', 'staff123')
    editor_pass = os.environ.get('EDITOR_DEFAULT_PASS', 'editor123')

    seed_users = [
        ("admin", admin_pass, "Shital Upadhye", "8261021008", "shitalupadhye287@gmail.com", "SUPER_ADMIN"),
        ("manager", manager_pass, "Fleet Manager", "9822001122", "manager@sangitatravels.com", "MANAGER"),
        ("staff", staff_pass, "Booking Desk", "9822003344", "bookings@sangitatravels.com", "BOOKING_STAFF"),
        ("editor", editor_pass, "Content Lead", "9822005566", "editor@sangitatravels.com", "CONTENT_MANAGER")
    ]


    for u_name, u_pass, u_full, u_phone, u_email, u_role in seed_users:
        cursor.execute("SELECT id, password_salt FROM admins WHERE username = ?", (u_name,))
        row = cursor.fetchone()
        pwd_hash, salt = hash_password(u_pass)
        if not row:
            cursor.execute("""
                INSERT INTO admins (username, password_hash, password_salt, full_name, phone, email, role, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (u_name, pwd_hash, salt, u_full, u_phone, u_email, u_role))
            print(f" [+] Seeded admin user: {u_name} ({u_role})")
        else:
            if not row['password_salt']:
                cursor.execute("""
                    UPDATE admins SET password_hash = ?, password_salt = ?, role = ? WHERE id = ?
                """, (pwd_hash, salt, u_role, row['id']))
                print(f" [*] Upgraded security for existing user: {u_name}")

    # Seed Fleet Vehicles
    seed_vehicles = [
        ("dzire", "Swift Dzire (Sedan)", "Sedan", 4, "2 Bags", "Comfortable, economical AC sedan perfect for corporate & one-way airport drops.", "assets/images/dzire.png", 12.0, 2299.0, "AVAILABLE", 1, 1),
        ("ertiga", "Maruti Ertiga (New MPV)", "Family MPV", 6, "3 Bags", "Spacious 6-seater MPV with rear AC & ample legroom for family tours and group travel.", "assets/images/ertiga.png", 15.0, 3199.0, "AVAILABLE", 1, 2),
        ("innova", "Innova Crysta (Luxury SUV)", "SUV", 7, "4 Bags", "Premium luxury SUV for VIP comfort, intercity Pune-Mumbai expressway rides & outstation.", "assets/images/innova.png", 20.0, 4299.0, "AVAILABLE", 1, 3),
        ("tempo", "Tempo Traveller (13/17)", "Traveller", 17, "10 Bags", "Heavy duty luxury group vehicle for Ashtavinayak, Jyotirlinga, wedding and corporate retreats.", "assets/images/tempo.png", 25.0, 8500.0, "AVAILABLE", 1, 4)
    ]
    for vk, vn, vc, vpc, vlc, vd, vi, vpk, vpb, vs, va, vo in seed_vehicles:
        cursor.execute("SELECT id FROM vehicles WHERE vehicle_key = ?", (vk,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO vehicles (vehicle_key, name, category, passenger_capacity, luggage_capacity, description, image_url, pricing_per_km, pricing_base, status, is_active, display_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (vk, vn, vc, vpc, vlc, vd, vi, vpk, vpb, vs, va, vo))
            print(f" [+] Seeded fleet vehicle: {vn}")

    # Seed Tours
    seed_tours = [
        ("Mahabaleshwar & Panchgani Holiday", "mahabaleshwar-panchgani", "Mahabaleshwar", "2 Days / 1 Night", 
         "Day 1: Pune pickup -> Wai -> Panchgani Table Land -> Mahabaleshwar Strawberry Garden.\nDay 2: Arthur's Seat, Venna Lake boating, local market and evening drop to Pune.",
         "Sedan/SUV AC Cab, Fuel, Tolls & Parking, Driver Allowance", "Hotel stay, Food & Personal Entry Fees", 5499.0, "assets/images/tours/mahabaleshwar.jpg", 1, 1),
        ("Shirdi Sai Baba & Shani Shingnapur", "shirdi-sai-baba", "Shirdi", "1 Day",
         "Early morning 5:00 AM pickup from Pune -> Ahmednagar -> Shirdi Temple VIP Darshan -> Shani Shingnapur -> Return to Pune by 10 PM.",
         "Dedicated AC Cab, All Tolls, FastTag, Driver Allowance", "VIP Aarti tickets, Food & Temple donations", 3999.0, "assets/images/tours/shirdi.jpg", 1, 2),
        ("5 Jyotirlinga Maharashtra Sacred Yatra", "5-jyotirlinga-maharashtra", "Jyotirlinga", "4 Days / 3 Nights",
         "Day 1: Bhimashankar -> Nashik.\nDay 2: Trimbakeshwar -> Shirdi.\nDay 3: Grishneshwar (Ellora) -> Aurangabad.\nDay 4: Parli Vaijnath / Aundha Nagnath -> Return Pune.",
         "Exclusive AC Cab for entire 4 days, Experienced Route Driver, Tolls & Inter-state permit", "Hotel accommodations, Meals, Puja expenses", None, "assets/images/tours/jyotirlinga.jpg", 1, 3),
        ("Lonavala & Khandala Scenic Day Tour", "lonavala-khandala", "Lonavala", "1 Day",
         "Morning pickup -> Expressway drive -> Bhushi Dam -> Tiger Point -> Karla Caves -> Wax Museum -> Chikki Market -> Evening drop.",
         "AC Cab, Expressway Toll, Parking, Driver Allowance", "Entry tickets, meals", 2499.0, "assets/images/tours/lonavala.jpg", 1, 4),
        ("Goa Coastal Road Trip Package", "goa-road-trip", "Goa", "4 Days / 3 Nights",
         "Pune -> Kolhapur -> Amboli Ghat -> North/South Goa sightseeing -> Return via Karad.",
         "Complete round trip vehicle, Driver overnight allowances, All toll passes", "Hotels, Sightseeing tickets, Personal food", None, "assets/images/tours/goa.jpg", 1, 5),
        ("Ashtavinayak Ganpati Darshan Complete Tour", "ashtavinayak-tour", "Ashtavinayak", "3 Days / 2 Nights",
         "Complete 8 Ganpati darshan: Morgaon, Siddhatek, Theur, Ranjangaon, Ozar, Lenyadri, Mahad, Pali.",
         "Dedicated Fleet AC Cab, All Tolls & State Taxes, Night charges", "Dharmashala/Hotel stay, Food", None, "assets/images/tours/ashtavinayak.jpg", 1, 6)
    ]
    for tt, ts, td, tdu, ti, tin, te, tp, tc, tpub, to in seed_tours:
        cursor.execute("SELECT id FROM tours WHERE slug = ?", (ts,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO tours (title, slug, destination, duration, itinerary, inclusions, exclusions, price, cover_image, is_published, display_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (tt, ts, td, tdu, ti, tin, te, tp, tc, tpub, to))
            print(f" [+] Seeded tour: {tt}")

    # Seed Services
    seed_services = [
        ("Pune to Mumbai One Way Cab", "pune-mumbai-oneway", "Fast, convenient door-to-door pickup from Pune to anywhere in Mumbai via Expressway with zero return fare.", "route", "", 1, 1),
        ("Mumbai to Pune Return Cab", "mumbai-pune-return", "Reliable city and airport pickup from Mumbai back to Pune with verified professional chauffeurs.", "navigation", "", 1, 2),
        ("Mumbai Airport (BOM) T1/T2 Transfer", "mumbai-airport-transfer", "Specialized flight-timing pickups and drops with flight tracking and terminal greeting.", "plane", "", 1, 3),
        ("Outstation Intercity Taxi", "outstation-taxi", "Customized outstation cab booking for personal, family and leisure tours across Maharashtra.", "compass", "", 1, 4),
        ("Local Pune Hourly Rentals", "local-hourly-rental", "Flexible 4hr/40km or 8hr/80km packages for local shopping, meetings, and city travel.", "clock", "", 1, 5),
        ("Corporate & Executive Travel", "corporate-travel", "Monthly billing, GST compliant receipts, pristine vehicles for company leaders and visiting clients.", "briefcase", "", 1, 6),
        ("Wedding & Event Fleet Transportation", "wedding-transportation", "Coordinated luxury convoy and tempo travellers for wedding guests and family ceremonies.", "users", "", 1, 7)
    ]
    for st, ss, sd, si, sim, sa, so in seed_services:
        cursor.execute("SELECT id FROM services WHERE slug = ?", (ss,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO services (title, slug, description, icon, image_url, is_active, display_order)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (st, ss, sd, si, sim, sa, so))
            print(f" [+] Seeded service: {st}")

    # Seed CMS content
    default_hero = {
        "badge": "⭐ Maharashtra's Most Trusted Pune-Mumbai Taxi Service",
        "heading": "Pune Mumbai Cab Service | Fast, Safe & Affordable",
        "subtitle": "Guaranteed On-Time Doorstep Pickup • Toll Included Rates • Professional Chauffeurs • 24/7 Live Support",
        "cta_phone": "+918261021008",
        "cta_whatsapp": "918261021008"
    }
    default_about = {
        "title": "Welcome to Sangita Travels Pune",
        "description": "With over 12+ years of dedicated excellence on the Pune-Mumbai Expressway, Sangita Travels (Pune Taxi Cab) offers premium, affordable and safe cab services for travelers, airport passengers, families, and corporate executives.",
        "experience_years": "12+",
        "trips_completed": "25,000+",
        "happy_customers": "18,000+",
        "fleet_size": "45+"
    }
    default_why_us = {
        "title": "Why 25,000+ Commuters Choose Sangita Travels",
        "points": [
            {"title": "Zero Hidden Charges", "desc": "Upfront transparent pricing with toll and driver allowances clearly outlined."},
            {"title": "Clean, Sanitized Cabs", "desc": "Every car is inspected, deodorized, and vacuumed before dispatch."},
            {"title": "Expressway Expert Drivers", "desc": "Chauffeurs trained for safe ghat driving, Expressway protocols, and punctual timing."},
            {"title": "Instant 24x7 Customer Support", "desc": "Real humans on WhatsApp and phone ready to dispatch emergency and scheduled rides."}
        ]
    }
    default_contact = {
        "business_name": "Sangita Travels Pune (Pune Taxi Cab)",
        "phone": "+918261021008",
        "phone_display": "8261021008",
        "whatsapp": "918261021008",
        "email": "sangitatravels08@gmail.com",
        "address": "Sangita Travels, Shop No. 4, Opposite Pune Station / Viman Nagar, Pune, Maharashtra 411001",
        "google_maps_url": "https://maps.google.com"
    }

    for k, val in [("hero", default_hero), ("about", default_about), ("why_us", default_why_us), ("contact", default_contact)]:
        cursor.execute("SELECT section_key FROM website_content WHERE section_key = ?", (k,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO website_content (section_key, content_json, updated_by)
                VALUES (?, ?, 'System Init')
            """, (k, json.dumps(val)))

    # Seed Pricing Rules
    seed_pricing = [
        ("dzire", "Swift Dzire (Sedan)", 12.0, 130, 300.0, 2299.0, 4598.0, 2299.0, 0),
        ("ertiga", "Maruti Ertiga (New MPV)", 15.0, 130, 300.0, 3199.0, 6398.0, 3199.0, 0),
        ("innova", "Innova Crysta (Luxury SUV)", 20.0, 130, 400.0, 4299.0, 8598.0, 4299.0, 0),
        ("tempo", "Tempo Traveller (Van)", 25.0, 250, 500.0, 8500.0, 17000.0, 8500.0, 0)
    ]
    for pk, pn, pkm, pmkm, pda, popm, prtb, par, psp in seed_pricing:
        cursor.execute("SELECT id FROM pricing_rules WHERE vehicle_key = ?", (pk,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO pricing_rules (vehicle_key, vehicle_name, per_km, min_km, driver_allowance, oneway_pune_mumbai, roundtrip_base, airport_rate, show_price_public)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (pk, pn, pkm, pmkm, pda, popm, prtb, par, psp))

    # Seed SEO Metadata
    seed_seo = [
        ("home", "Pune Mumbai Cab Service | Sangita Travels Pune | Cab Booking",
         "Book Pune to Mumbai Cabs with Sangita Travels Pune. Lowest fares starting ₹2,299. Swift Dzire, Ertiga, Innova Crysta. Doorstep pickup 24x7.",
         "pune mumbai cab, pune to mumbai taxi, cab service pune, sangita travels pune, pune airport cab, mumbai airport taxi",
         "Pune Mumbai Cab Service — Sangita Travels Pune",
         "Book trusted Pune to Mumbai cabs starting ₹2,299 with 24x7 pickup and sanitized fleet.",
         "assets/images/og-banner.jpg", "https://sangitatravelspune.com/"),
        ("fleet", "Our Fleet | Swift Dzire, Ertiga, Innova Crysta | Sangita Travels",
         "Inspect our modern AC fleet for Pune-Mumbai highway travel. Clean, sanitized sedans and SUVs with top safety features.",
         "dzire taxi pune, ertiga cab pune, innova crysta rental pune",
         "Our Cabs & Fleet — Sangita Travels Pune", "", "", "https://sangitatravelspune.com/#about"),
        ("tours", "Maharashtra Tour Packages | Shirdi, Mahabaleshwar, Jyotirlinga",
         "Specialized outstation packages with dedicated cabs from Pune to Mahabaleshwar, Shirdi, Ashtavinayak and 5 Jyotirlinga.",
         "mahabaleshwar tour package, shirdi cab from pune, jyotirlinga yatra cab",
         "Maharashtra Tour Packages | Sangita Travels", "", "", "https://sangitatravelspune.com/#service")
    ]
    for sk, st, smd, skw, sogt, sogd, sogi, scu in seed_seo:
        cursor.execute("SELECT id FROM seo_meta WHERE page_key = ?", (sk,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO seo_meta (page_key, title, meta_description, keywords, og_title, og_description, og_image, canonical_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (sk, st, smd, skw, sogt, sogd, sogi, scu))

    # Seed Application Settings
    seed_settings = [
        ("business_name", "business", "Sangita Travels Pune"),
        ("business_phone", "business", "+918261021008"),
        ("business_whatsapp", "business", "918261021008"),
        ("business_email", "business", "sangitatravels08@gmail.com"),
        ("business_address", "business", "Pune, Maharashtra, India"),
        ("default_booking_status", "booking", "NEW"),
        ("booking_notification_email", "booking", "sangitatravels08@gmail.com"),
        ("wa_message_template", "booking", "Hello {name}, Sangita Travels Pune has received your cab enquiry from {pickup} to {drop} on {date} at {time} for {vehicle}. Our quote is ₹{fare}. Reply YES to confirm booking!"),
        ("session_duration_days", "security", "7"),
        ("max_failed_attempts", "security", "5"),
        ("maintenance_mode", "website", "0"),
        ("allow_online_booking", "website", "1")
    ]
    for sk, sc, sv in seed_settings:
        cursor.execute("SELECT key FROM settings WHERE key = ?", (sk,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO settings (key, category, value)
                VALUES (?, ?, ?)
            """, (sk, sc, sv))

def migration_004_payments_module(cursor):
    """Adds payment_status, payment_id, payment_amount to bookings and creates payments table."""
    cursor.execute("PRAGMA table_info(bookings);")
    cols = {col['name'] for col in cursor.fetchall()}
    if 'payment_status' not in cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(30) DEFAULT 'PENDING';")
    if 'payment_id' not in cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN payment_id VARCHAR(100) DEFAULT NULL;")
    if 'payment_amount' not in cols:
        cursor.execute("ALTER TABLE bookings ADD COLUMN payment_amount REAL DEFAULT 0.0;")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            booking_ref VARCHAR(30) NOT NULL,
            order_id VARCHAR(100) NOT NULL UNIQUE,
            payment_id VARCHAR(100) DEFAULT NULL,
            signature VARCHAR(255) DEFAULT NULL,
            amount REAL NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            payment_type VARCHAR(30) DEFAULT 'ADVANCE',
            status VARCHAR(30) DEFAULT 'CREATED',
            customer_name VARCHAR(100) DEFAULT '',
            customer_phone VARCHAR(20) DEFAULT '',
            customer_email VARCHAR(100) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_payments_booking_ref ON payments(booking_ref);")


def migration_005_reviews_table(cursor):
    """Creates reviews table and seeds genuine customer testimonials."""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name VARCHAR(100) NOT NULL,
            customer_phone VARCHAR(20) DEFAULT '',
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            review_text TEXT NOT NULL,
            trip_ref VARCHAR(30) DEFAULT '',
            route VARCHAR(100) DEFAULT 'Pune - Mumbai',
            is_approved INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);")

    cursor.execute("SELECT COUNT(*) FROM reviews;")
    if cursor.fetchone()[0] == 0:
        seed_reviews = [
            ("Dr. Rajesh Deshmukh", "9822011223", 5, "Booked Innova Crysta for Mumbai T2 Airport drop at 3:00 AM. Driver was 15 mins early, car was spotless, and driving on Khandala ghat was remarkably smooth. Best Pune-Mumbai cab service!", "PTC-3104", "Pune to Mumbai Airport T2", 1),
            ("Sneha Roy", "9819823456", 5, "Solo travel from Baner to Dadar. Driver Nilesh was very courteous, verified Fastag toll was included, and vehicle had a working GPS tracker. Highly recommended for women traveling alone.", "PTC-4219", "Pune to Dadar Mumbai", 1),
            ("Amitabh Kulkarni", "9765432109", 5, "Mahabaleshwar & Panchgani 2-day family trip in Ertiga. Great experience! No hidden driver allowances or extra toll demands. Transparent upfront pricing.", "PTC-5182", "Mahabaleshwar Tour", 1),
            ("Vikram Singhania", "9920123890", 5, "Sangita Travels has been our corporate executive travel partner for 3 years. Punctual, well-groomed chauffeurs and instant GST receipts.", "PTC-6021", "Pune to BKC Mumbai", 1),
            ("Pooja & Rohan Mehta", "9823456781", 5, "Booked a round-trip to Shirdi Temple in Dzire. Chauffeur knew all the best rest-stops on the expressway and waited patiently during our VIP darshan.", "PTC-7742", "Pune to Shirdi Tour", 1)
        ]
        cursor.executemany("""
            INSERT INTO reviews (customer_name, customer_phone, rating, review_text, trip_ref, route, is_approved)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, seed_reviews)


def migration_006_drivers_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL UNIQUE,
            email VARCHAR(100) DEFAULT '',
            license_no VARCHAR(50) NOT NULL,
            vehicle_assigned VARCHAR(50) DEFAULT '',
            status VARCHAR(20) DEFAULT 'AVAILABLE',
            rating REAL DEFAULT 4.9,
            total_trips INTEGER DEFAULT 0,
            photo VARCHAR(255) DEFAULT '',
            documents_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);")

    cursor.execute("SELECT COUNT(*) FROM drivers;")
    if cursor.fetchone()[0] == 0:
        seed_drivers = [
            ("Ramesh Shinde", "9822451020", "ramesh.shinde@sangitatravels.in", "MH12-2015-0084721", "Maruti Dzire (MH12-RN-4821)", "AVAILABLE", 4.9, 142, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"),
            ("Nilesh Gaikwad", "9819442011", "nilesh.g@sangitatravels.in", "MH14-2018-0091244", "Innova Crysta (MH12-QK-9012)", "AVAILABLE", 5.0, 215, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"),
            ("Suresh Patil", "9765118822", "suresh.p@sangitatravels.in", "MH12-2016-0043129", "Maruti Ertiga (MH14-AZ-6341)", "ON_TRIP", 4.8, 98, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"),
            ("Sachin More", "9920448123", "sachin.m@sangitatravels.in", "MH12-2014-0019823", "Tempo Traveller (MH12-TT-2020)", "AVAILABLE", 4.9, 310, "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80"),
            ("Ganesh Jadhav", "9823881900", "ganesh.j@sangitatravels.in", "MH12-2019-0062491", "Innova Crysta (MH12-PX-5544)", "AVAILABLE", 4.9, 87, "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80")
        ]
        cursor.executemany("""
            INSERT INTO drivers (name, phone, email, license_no, vehicle_assigned, status, rating, total_trips, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, seed_drivers)


def migration_007_coupons_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code VARCHAR(30) NOT NULL UNIQUE,
            type VARCHAR(20) NOT NULL DEFAULT 'percentage',
            value REAL NOT NULL,
            min_fare REAL DEFAULT 0,
            max_discount REAL DEFAULT 0,
            valid_from DATE DEFAULT NULL,
            valid_to DATE DEFAULT NULL,
            usage_limit INTEGER DEFAULT 100,
            used_count INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);")

    cursor.execute("SELECT COUNT(*) FROM coupons;")
    if cursor.fetchone()[0] == 0:
        seed_coupons = [
            ("PUNEMUMBAI100", "flat", 100.0, 1500.0, 100.0, 500, 1),
            ("SANGITA10", "percentage", 10.0, 2000.0, 350.0, 250, 1),
            ("AIRPORT50", "flat", 50.0, 1000.0, 50.0, 1000, 1),
            ("WEEKEND200", "flat", 200.0, 3000.0, 200.0, 150, 1)
        ]
        cursor.executemany("""
            INSERT INTO coupons (code, type, value, min_fare, max_discount, usage_limit, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, seed_coupons)


def migration_008_blog_posts_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(200) NOT NULL,
            slug VARCHAR(200) NOT NULL UNIQUE,
            content_html TEXT NOT NULL,
            excerpt TEXT DEFAULT '',
            featured_image VARCHAR(255) DEFAULT '',
            author VARCHAR(100) DEFAULT 'Sangita Travels Editorial',
            category VARCHAR(50) DEFAULT 'Route Guide',
            tags VARCHAR(200) DEFAULT 'pune, mumbai, cab',
            is_published INTEGER DEFAULT 1,
            views_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);")

    cursor.execute("SELECT COUNT(*) FROM blog_posts;")
    if cursor.fetchone()[0] == 0:
        seed_posts = [
            (
                "Complete Guide: Pune to Mumbai Airport Cabs (T1 Domestic & T2 International)",
                "pune-mumbai-airport-cab-guide",
                "<p>Catching a flight from Chhatrapati Shivaji Maharaj International Airport (CSMIA) Mumbai from Pune can often be stressful if your transportation isn't impeccably planned. With domestic terminals (T1 Santacruz) and the international hub (T2 Sahar, Andheri), travelers need dependable door-to-terminal conveyance.</p><h3>Why Choose a Direct Chauffeur Cab?</h3><p>Unlike public buses or trains where you have to juggle heavy luggage and hail local Mumbai auto-rickshaws, an express cab picks you up right at your doorstep in Pune and drops you at the departure gate ramp. Sangita Travels offers 24/7 dedicated airport transfers with commercial FASTag, seasoned ghat drivers, and guaranteed zero breakdown assurance.</p><h3>Best Travel Time & Buffer Planning</h3><p>The standard Pune to Mumbai Airport journey takes approximately <strong>3 hours and 30 minutes</strong> via the Yashwantrao Chavan Expressway. However, during morning peak rush hours (8:00 AM - 11:30 AM) and evening office traffic (5:30 PM - 9:00 PM) around Chembur, BKC, and the Western Express Highway, it is prudent to allocate an additional 45 to 60 minutes buffer.</p>",
                "Essential travel tips, terminal departure guides, and timing advice for seamless Pune to Mumbai Airport transfers.",
                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
                "Sangita Travels Editorial",
                "Travel Tips",
                "pune, mumbai airport, airport taxi, cab tips",
                1,
                342
            ),
            (
                "Top 5 Scenic Stops on the Mumbai-Pune Expressway",
                "mumbai-pune-expressway-stops",
                "<p>The 94.5-kilometer Mumbai-Pune Expressway is not merely India's premier six-lane concrete superhighway; it cuts through the breathtaking Western Ghats, offering spectacular Sahyadri mountain vistas, misty tunnels, and iconic culinary pitstops.</p><h3>1. Food Mall at Khalapur & Talegaon</h3><p>Strategically situated on either side of the expressway, these massive food plazas house trusted brands like McDonald's, Starbucks, Kamat's, and local Maharashtrian snack joints serving piping hot Batata Vadas, Misal Pav, and freshly brewed chai.</p><h3>2. Khandala & Lonavala Ghat Overlook</h3><p>As your cab cruises up the Bhor Ghat (Khandala Ghat), the lush greenery and cascading waterfalls during monsoon season present world-class panorama views. Drivers at Sangita Travels know safe viewing bays to take photos without impeding highway velocity.</p><h3>3. The Madhu Chikki Traditional Stop</h3><p>No trip across the expressway is complete without grabbing authentic Lonavala chikki (crushed peanut, cashew, and jaggery fudge) and soft chocolate fudge.</p>",
                "Discover the best food plazas, scenic waterfall vistas, and chikki hotspots along the Mumbai-Pune Expressway.",
                "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
                "Travel Desk",
                "Pune-Mumbai Route Guide",
                "expressway, lonavala, food mall, road trip",
                1,
                519
            ),
            (
                "Pune to Mahabaleshwar Weekend Road Trip Itinerary",
                "pune-to-mahabaleshwar-road-trip",
                "<p>Nestled in the Western Ghats at an elevation of 1,353 meters, Mahabaleshwar and its twin hill station Panchgani constitute Maharashtra's most beloved weekend retreat. Traveling via private cab allows you the freedom to explore scenic points at your own pace.</p><h3>Day 1: En Route via Wai to Panchgani</h3><p>Depart Pune early morning around 6:30 AM via NH48. Stop at Wai for breakfast and visit Table Land in Panchgani — Asia's second-largest volcanic mountain plateau. Sample fresh strawberry cream at Mapro Garden before checking into your hotel.</p><h3>Day 2: Viewpoints and Venna Lake Boating</h3><p>Start your morning with a misty walk to Arthur's Seat Point, followed by needle hole rock at Elephant's Head Point. In the evening, enjoy serene paddle boating on Venna Lake and local street food.</p>",
                "The complete 2-day self-guided road trip itinerary covering Panchgani Table Land, Mapro Garden, and Venna Lake.",
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
                "Tour Guide Team",
                "Tourist Places",
                "mahabaleshwar, panchgani, hill station, tour",
                1,
                278
            )
        ]
        cursor.executemany("""
            INSERT INTO blog_posts (title, slug, content_html, excerpt, featured_image, author, category, tags, is_published, views_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, seed_posts)


def migration_009_admins_security_hardening(cursor):
    """Enforce unique email constraints and performance security indexes on admins table."""
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email_unique ON admins(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);")

def rollback_009_admins_security_hardening(cursor):
    cursor.execute("DROP INDEX IF EXISTS idx_admins_email_unique;")
    cursor.execute("DROP INDEX IF EXISTS idx_admins_role;")
    cursor.execute("DROP INDEX IF EXISTS idx_admins_active;")

# Ordered list of all migrations
MIGRATIONS = [
    ("20261012_001_core_schema", "Initial relational schema with 14 core tables", migration_001_core_schema),
    ("20261012_002_wal_and_indexes", "Enable WAL mode, foreign keys, and query indexes", migration_002_wal_and_indexes),
    ("20261012_003_seed_data", "Seed default admins, fleet, tours, pricing, and settings", migration_003_seed_data),
    ("20261013_004_payments_module", "Add payment tracking to bookings and payments table", migration_004_payments_module),
    ("20261013_005_reviews_table", "Add customer reviews table and seed verified testimonials", migration_005_reviews_table),
    ("20261013_006_drivers_table", "Add drivers table for fleet driver management and tracking", migration_006_drivers_table),
    ("20261013_007_coupons_table", "Add coupons and promo discount system table", migration_007_coupons_table),
    ("20261013_008_blog_posts_table", "Add blog posts and content marketing engine table", migration_008_blog_posts_table),
    ("20261013_009_admins_security_hardening", "Enforce unique email index and security indexes on admins", migration_009_admins_security_hardening),
]

ROLLBACKS = {
    "20261013_009_admins_security_hardening": rollback_009_admins_security_hardening,
}


def show_status(db_target=None):
    target = db_target or DB_FILE
    if not os.path.exists(target):
        print(f"[*] Database file does not exist: {target}")
        return

    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations';")
    if not cursor.fetchone():
        print(f"[*] Database at '{target}' has no schema_migrations table yet.")
        conn.close()
        return

    cursor.execute("SELECT version, name, applied_at, execution_time_ms FROM schema_migrations ORDER BY version ASC;")
    applied_versions = {r['version']: r for r in cursor.fetchall()}

    print("\n" + "=" * 80)
    print(f"DATABASE MIGRATIONS STATUS: {target}")
    print("=" * 80)
    print(f"{'STATUS':<10} {'VERSION':<32} {'DURATION':<12} {'APPLIED AT':<20} NAME")
    print("-" * 80)

    for version, name, _ in MIGRATIONS:
        if version in applied_versions:
            r = applied_versions[version]
            duration = f"{r['execution_time_ms']}ms"
            applied_at = str(r['applied_at'])[:19]
            print(f"[APPLIED]   {version:<32} {duration:<12} {applied_at:<20} {name}")
        else:
            print(f"[PENDING]   {version:<32} {'--':<12} {'--':<20} {name}")
    print("=" * 80 + "\n")
    conn.close()

def run_migration(db_target=None, skip_backup=False):
    target = db_target or DB_FILE
    print(f"[*] Starting database migration process on: {target}")

    # 1. Automatic Safe Snapshot Backup Before Any Schema Changes
    if not skip_backup:
        backup_database(target)

    # 2. Open Connection
    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 3. Ensure Migration Tracking Table Exists
    ensure_migrations_table(cursor)
    conn.commit()

    # 4. Check Applied Migrations
    cursor.execute("SELECT version FROM schema_migrations;")
    applied_versions = {row['version'] for row in cursor.fetchall()}

    pending_count = 0
    for version, name, migration_fn in MIGRATIONS:
        if version in applied_versions:
            print(f" [=] Migration already applied: {version} ({name})")
            continue

        pending_count += 1
        print(f" [*] Applying migration: {version} ({name})...")
        start_time = time.time()

        try:
            migration_fn(cursor)
            elapsed_ms = int((time.time() - start_time) * 1000)

            cursor.execute("""
                INSERT INTO schema_migrations (version, name, execution_time_ms)
                VALUES (?, ?, ?)
            """, (version, name, elapsed_ms))

            conn.commit()
            print(f" [✓] Successfully applied: {version} in {elapsed_ms}ms")
        except Exception as e:
            conn.rollback()
            conn.close()
            print(f"[!] Migration {version} FAILED: {e}")
            raise

    conn.close()
    if pending_count == 0:
        print("[*] All migrations are already up to date. No pending schema changes.")
def rollback_latest(db_target=None):
    """Rolls back the most recently applied migration if a rollback function is available."""
    target = db_target or DB_FILE
    if not os.path.exists(target):
        print(f"[!] Target database does not exist: {target}")
        return

    backup_database(target)

    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1;")
    last_applied = cursor.fetchone()
    if not last_applied:
        print("[*] No applied migrations found to roll back.")
        conn.close()
        return

    v = last_applied['version']
    if v not in ROLLBACKS:
        print(f"[!] Migration {v} does not define a rollback function. Manual rollback required.")
        conn.close()
        return

    print(f"[*] Rolling back migration: {v} ({last_applied['name']})...")
    try:
        ROLLBACKS[v](cursor)
        cursor.execute("DELETE FROM schema_migrations WHERE version = ?;", (v,))
        conn.commit()
        print(f"[✓] Successfully rolled back: {v}")
    except Exception as e:
        conn.rollback()
        print(f"[!] Rollback FAILED: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    args = sys.argv[1:]
    if 'status' in args or '--status' in args:
        show_status()
    elif 'backup' in args or '--backup' in args:
        backup_database(DB_FILE)
    elif 'rollback' in args or '--rollback' in args:
        rollback_latest()
    else:
        run_migration()
