-- ============================================================
-- SANGITA TRAVELS PUNE (PUNE TAXI CAB)
-- BEAST MODE Production Relational Database Schema
-- File: schema.sql
-- ============================================================

PRAGMA foreign_keys = ON;

-- 1. Admins & Roles Table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email_unique ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(64) PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    ip_address VARCHAR(45) DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_admin ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 3. Customers Table
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

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref VARCHAR(30) UNIQUE NOT NULL,
    customer_id INTEGER NULL,
    customer_name VARCHAR(100) DEFAULT 'Guest Customer',
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100) DEFAULT '',
    trip_type VARCHAR(30) NOT NULL DEFAULT 'oneway',
    pickup_location TEXT NOT NULL,
    drop_location TEXT NOT NULL,
    travel_date DATE NOT NULL,
    travel_time VARCHAR(20) DEFAULT 'Flexible',
    return_date DATE NULL,
    passengers INTEGER DEFAULT 4,
    vehicle_key VARCHAR(30) NOT NULL,
    vehicle_name VARCHAR(100) NOT NULL,
    estimated_fare REAL NOT NULL DEFAULT 0.0,
    quoted_amount REAL DEFAULT NULL,
    final_amount REAL DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    payment_id VARCHAR(100) DEFAULT NULL,
    payment_amount REAL DEFAULT 0.0,
    assigned_driver VARCHAR(100) DEFAULT 'Unassigned',
    driver_phone VARCHAR(20) DEFAULT '',
    customer_notes TEXT DEFAULT '',
    internal_notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);

-- 5. Vehicles Fleet Table
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

-- 6. Tours Table
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

-- 7. Services Table
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

-- 8. Website Content CMS Table
CREATE TABLE IF NOT EXISTS website_content (
    section_key VARCHAR(50) PRIMARY KEY,
    content_json TEXT NOT NULL,
    updated_by VARCHAR(100) DEFAULT 'Admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Media Library Table
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

-- 10. Pricing Rules Table
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

-- 11. SEO Meta Table
CREATE TABLE IF NOT EXISTS seo_meta (
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

-- 12. Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type VARCHAR(50) NOT NULL,
    metadata_json TEXT DEFAULT '{}',
    ip_address VARCHAR(45) DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

-- 13. Audit Logs Table
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

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- 14. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Payments Table
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

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_ref ON payments(booking_ref);

-- 16. Reviews Table
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

-- 17. Drivers Table
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

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);

-- 18. Coupons Table
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

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- 19. Blog Posts Table
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

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);


