/**
 * SANGITA TRAVELS PUNE (PUNE TAXI CAB)
 * Unified Enterprise Domain & Relational Data Models
 * Synchronized with SQLite relational database schema (backend/schema.sql)
 */

export interface Booking {
  id: number;
  booking_ref: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  trip_type: 'oneway' | 'roundtrip' | 'airport' | 'outstation' | string;
  pickup_location: string;
  drop_location: string;
  travel_date: string;
  travel_time: string;
  return_date?: string | null;
  passengers: number;
  vehicle_key: string;
  vehicle_name: string;
  estimated_fare: number;
  quoted_amount?: number | null;
  final_amount?: number | null;
  status:
    | 'NEW'
    | 'CONTACTED'
    | 'CONFIRMED'
    | 'ASSIGNED'
    | 'IN_TRANSIT'
    | 'COMPLETED'
    | 'CANCELLED'
    | string;
  assigned_driver?: string;
  driver_phone?: string;
  customer_notes?: string;
  internal_notes?: string;
  customer_name_rel?: string;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  total_bookings: number;
  last_trip?: string | null;
  preferred_vehicle?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Vehicle {
  id: number;
  vehicle_key: string;
  name: string;
  category: string;
  passenger_capacity: number;
  /** DB column is VARCHAR(50) (e.g. '2 Bags') */
  luggage_capacity: string;
  description: string;
  image_url: string;
  pricing_per_km: number;
  pricing_base: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'BUSY' | 'active' | 'inactive' | string;
  is_active: number;
  display_order: number;
  /** Backward-compatible alias for display_order */
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Tour {
  id: number;
  title: string;
  slug: string;
  destination: string;
  duration: string;
  price: number;
  itinerary: string;
  inclusions?: string;
  exclusions?: string;
  cover_image: string;
  is_published: number;
  display_order: number;

  /** Backward-compatible UI aliases */
  starting_price?: number;
  description?: string;
  image_url?: string;
  highlights_json?: string;
  is_popular?: number;
  is_active?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  image_url: string;
  is_active: number;
  display_order: number;
  created_at?: string;
  updated_at?: string;

  /** Backward-compatible UI aliases */
  short_desc?: string;
  full_desc?: string;
  sort_order?: number;
}

export interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  category: string;
  uploaded_by: string;
  created_at: string;
}

export interface PricingRule {
  id: number;
  vehicle_key: string;
  vehicle_name: string;
  per_km: number;
  min_km: number;
  driver_allowance: number;
  oneway_pune_mumbai: number;
  roundtrip_base: number;
  airport_rate: number;
  show_price_public: number;
  updated_at?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'BOOKING_STAFF' | 'CONTENT_MANAGER' | string;
  is_active: number;
  password_hash?: string;
  password_salt?: string;
  failed_attempts?: number;
  locked_until?: string | null;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminSession {
  token: string;
  admin_id: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface SeoMeta {
  id?: number;
  /** Database column in schema.sql */
  page_key: string;
  /** UI compatibility alias */
  page_identifier?: string;
  title: string;
  meta_description: string;
  keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  updated_at?: string;
}

export interface WebsiteContent {
  section_key: string;
  content_json: string;
  updated_by?: string;
  updated_at?: string;
}

export interface AnalyticsEvent {
  id: number;
  event_type: string;
  metadata_json?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AppSetting {
  key: string;
  category: string;
  value: string;
  updated_at?: string;
}

export interface Review {
  id: number;
  customer_name: string;
  customer_phone?: string;
  rating: number;
  review_text: string;
  trip_ref?: string;
  route?: string;
  is_approved?: number;
  created_at?: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  breakdown: Record<string, number>;
}

export interface SiteData {
  settings: Record<string, string>;
  fleet: Vehicle[];
  tours: Tour[];
  services: Service[];
  content: Record<string, string>;
  seo: Record<string, SeoMeta>;
  pricing?: PricingRule[];
  reviews?: Review[];
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  email?: string;
  license_no: string;
  vehicle_assigned?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE';
  rating: number;
  total_trips: number;
  photo?: string;
  documents_json?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DriverStats {
  total_drivers: number;
  available_drivers: number;
  on_trip_drivers: number;
  offline_drivers: number;
  average_rating: number;
  total_trips_completed: number;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  min_fare: number;
  max_discount: number;
  valid_from?: string;
  valid_to?: string;
  usage_limit: number;
  used_count: number;
  is_active: number;
  created_at?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content_html: string;
  excerpt?: string;
  featured_image?: string;
  author: string;
  category: string;
  tags?: string;
  is_published: number;
  views_count: number;
  created_at?: string;
  updated_at?: string;
}

