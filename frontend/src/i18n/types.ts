export type Language = 'en' | 'mr' | 'hi';

export interface TranslationDictionary {
  // Navigation
  nav_book_ride: string;
  nav_track_ride: string;
  nav_fleet: string;
  nav_tours: string;
  nav_services: string;
  nav_blog: string;
  nav_about: string;
  nav_faq: string;
  nav_contact: string;
  nav_staff_login: string;

  // Hero
  hero_badge: string;
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_subtitle: string;
  hero_cta_book: string;
  hero_cta_whatsapp: string;
  hero_feature_doorstep: string;
  hero_feature_toll: string;
  hero_feature_support: string;
  hero_feature_chauffeurs: string;

  // Booking Widget
  tab_oneway: string;
  tab_roundtrip: string;
  tab_airport: string;
  lbl_pickup: string;
  lbl_drop: string;
  lbl_travel_date: string;
  lbl_return_date: string;
  lbl_pickup_time: string;
  lbl_vehicle: string;
  lbl_passengers: string;
  lbl_name: string;
  lbl_phone: string;
  lbl_email: string;
  lbl_promo_code: string;
  btn_apply: string;
  btn_calculate: string;
  btn_confirm_booking: string;
  btn_instant_quote: string;
  msg_calculating: string;
  msg_booking_success: string;

  // Fleet Section
  fleet_badge: string;
  fleet_title: string;
  fleet_subtitle: string;
  fleet_starting_from: string;
  fleet_select_cab: string;

  // Tours Section
  tours_badge: string;
  tours_title: string;
  tours_subtitle: string;
  tours_view_details: string;

  // Trust / Why Us
  trust_experience: string;
  trust_trips: string;
  trust_rating: string;
  trust_fleet_size: string;

  // Footer
  footer_tagline: string;
  footer_active_desk: string;
  footer_popular_routes: string;
  footer_contact_support: string;
  footer_quick_links: string;
  footer_copyright: string;

  // Common
  call_24x7: string;
  whatsapp_chat: string;
  all_inclusive: string;
}
