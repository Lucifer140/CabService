import React, { useState, useEffect } from 'react';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import { Tour, Vehicle } from '../../types';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  ArrowLeft,
  Calendar,
  User,
  Car,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TourDetailPageProps {
  slug: string;
}

export const TourDetailPage: React.FC<TourDetailPageProps> = ({ slug }) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadTourData();
  }, [slug]);

  const loadTourData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch single tour by slug
      const res = await fetch(`/api/public/tours/${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tour) {
          setTour(data.tour);
          document.title = `${data.tour.title} | Sangita Travels Pune Tour Packages`;
        }
      }

      // 2. Fetch all tours for related tours sidebar
      const listRes = await fetch('/api/public/tours');
      if (listRes.ok) {
        const listData = await listRes.json();
        const toursList = listData.tours || [];
        setAllTours(toursList);

        // Fallback if single slug endpoint did not match directly
        if (!tour) {
          const matched = toursList.find((t: Tour) => t.slug === slug || String(t.id) === slug);
          if (matched) {
            setTour(matched);
            document.title = `${matched.title} | Sangita Travels Pune Tour Packages`;
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching tour detail:', err);
      setError('Unable to load tour package details. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  const getTourImage = (t: Partial<Tour>) => {
    if (t.cover_image && (t.cover_image.startsWith('assets/') || t.cover_image.startsWith('/assets/'))) {
      return t.cover_image;
    }
    const s = (t.slug || t.title || '').toLowerCase();
    if (s.includes('shirdi')) return 'assets/images/tours/shirdi.jpg';
    if (s.includes('jyotirlinga')) return 'assets/images/tours/jyotirlinga.jpg';
    if (s.includes('lonavala')) return 'assets/images/tours/lonavala.jpg';
    if (s.includes('ashtavinayak')) return 'assets/images/tours/ashtavinayak.jpg';
    if (s.includes('goa')) return 'assets/images/tours/goa.jpg';
    return 'assets/images/tours/mahabaleshwar.jpg';
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !travelDate) {
      alert('Please fill in your name, 10-digit mobile number, and pickup date.');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        customer_name: customerName,
        phone: customerPhone,
        pickup_address: pickupAddress || 'Pune Doorstep Pickup',
        drop_address: tour?.destination || 'Tour Destination',
        trip_type: 'TOUR',
        vehicle_type: selectedVehicle,
        pickup_date: travelDate,
        pickup_time: '07:00 AM',
        notes: `Tour Package: ${tour?.title || 'Tour'} (₹${tour?.price || tour?.starting_price})`,
        estimated_fare: tour?.price || tour?.starting_price || 4999,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setBookingSuccess(true);
      } else {
        // Fallback to whatsapp booking
        window.open(
          `https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20want%20to%20book%20${encodeURIComponent(tour?.title || 'Tour')}%20for%20date%20${travelDate}.%20Name:%20${encodeURIComponent(customerName)},%20Phone:%20${customerPhone}`,
          '_blank'
        );
        setBookingSuccess(true);
      }
    } catch {
      window.open(
        `https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20want%20to%20book%20${encodeURIComponent(tour?.title || 'Tour')}%20for%20date%20${travelDate}.%20Name:%20${encodeURIComponent(customerName)},%20Phone:%20${customerPhone}`,
        '_blank'
      );
      setBookingSuccess(true);
    } finally {
      setBookingLoading(false);
    }
  };

  const relatedTours = allTours
    .filter(t => t.slug !== slug && String(t.id) !== slug)
    .slice(0, 3);

  if (loading) {
    return (
      <div style={{ background: '#0A0F1D', color: '#F8FAFC', minHeight: '100dvh' }}>
        <Header />
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '140px 24px 80px', textAlign: 'center' }}>
          <div style={{ color: '#60A5FA', fontSize: '1.2rem', fontWeight: 600 }}>
            Loading Tour Details...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div style={{ background: '#0A0F1D', color: '#F8FAFC', minHeight: '100dvh' }}>
        <Header />
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '140px 24px 80px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Tour Package Not Found</h2>
          <p style={{ color: '#94A3B8', marginBottom: '32px' }}>
            The tour package you are looking for may have been updated or moved.
          </p>
          <a
            href="#tours"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#2563EB',
              color: '#FFF',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={18} /> View All Tour Packages
          </a>
        </main>
        <Footer />
      </div>
    );
  }

  // Parse itinerary into bullet items or paragraphs
  const itineraryItems = (tour.itinerary || tour.description || '')
    .split(/\n|•|\. /)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const inclusionItems = (tour.inclusions || 'Doorstep Pickup & Drop in Pune, Private AC Vehicle for entire trip, Experienced Chauffeur Allowance, Toll & Parking Taxes, 24/7 Operations Support')
    .split(/,|\n/)
    .map(s => s.trim())
    .filter(Boolean);

  const exclusionItems = (tour.exclusions || 'Hotel stay accommodation unless opted, Meals and refreshments, Entry tickets to monuments / amusement parks, Personal tips or laundry expenses')
    .split(/,|\n/)
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        background: '#0A0F1D',
        color: '#F8FAFC',
        minHeight: '100dvh',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <Header />

      <main id="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '110px 24px 80px' }}>
        {/* Breadcrumb Navigation */}

        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: '#64748B',
            marginBottom: '24px',
          }}
        >
          <a href="#/" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            Home
          </a>
          <ChevronRight size={14} />
          <a href="#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            Tour Packages
          </a>
          <ChevronRight size={14} />
          <span style={{ color: '#60A5FA', fontWeight: 600 }}>{tour.title}</span>
        </nav>

        {/* Hero Banner Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
            gap: '36px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 36px)',
            marginBottom: '48px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          }}
        >
          {/* Cover Photo */}
          <div
            style={{
              position: 'relative',
              borderRadius: '18px',
              overflow: 'hidden',
              minHeight: '300px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <img
              src={getTourImage(tour)}
              alt={tour.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(10, 15, 29, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} /> Verified Private Tour
            </div>
          </div>

          {/* Tour Meta & Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#60A5FA',
                fontSize: '0.9rem',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={16} /> {tour.destination}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={16} /> {tour.duration || 'Custom Plan'}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 800,
                lineHeight: 1.2,
                margin: '0 0 16px',
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              {tour.title}
            </h1>

            <p style={{ color: '#94A3B8', fontSize: '1.025rem', lineHeight: 1.6, margin: '0 0 24px' }}>
              Experience the ultimate comfort and freedom of a private outstation cab tour tailored to your schedule. Doorstep pickup anywhere in Pune with experienced highway chauffeurs.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                marginBottom: '28px',
                padding: '16px 20px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'block' }}>All-Inclusive Package Price</span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>
                  ₹{tour.price ?? tour.starting_price}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748B', marginLeft: '6px' }}>(Includes Toll & Vehicle)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="#book-now-form"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                }}
              >
                Book This Tour Now
              </a>
              <a
                href={`https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20am%20interested%20in%20${encodeURIComponent(tour.title)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#25D366',
                  color: '#000000',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <MessageCircle size={18} /> WhatsApp Enquiry
              </a>
            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns (Main Details vs Booking Widget Sidebar) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Itinerary, Inclusions, Exclusions */}
          <div>
            {/* Itinerary */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '30px',
                marginBottom: '32px',
              }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 20px', color: '#FFFFFF' }}>
                Tour Overview & Highlights
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {itineraryItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60A5FA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ color: '#CBD5E1', fontSize: '0.975rem', lineHeight: 1.6 }}>
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr)))',
                gap: '24px',
                marginBottom: '32px',
              }}
            >
              {/* Inclusions */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10B981', margin: 0 }}>
                    What's Included
                  </h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inclusionItems.map((inc, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#E2E8F0' }}>
                      <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span> {inc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <XCircle size={20} color="#EF4444" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#EF4444', margin: 0 }}>
                    What's Excluded
                  </h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {exclusionItems.map((exc, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#94A3B8' }}>
                      <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span> {exc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Why Choose Sangita Travels for Outstation */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '26px',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#F8FAFC' }}>
                Why Travelers Trust Us
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#60A5FA', marginBottom: '4px' }}>🛡️ Verified Chauffeurs</div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Commercial T-permit chauffeurs with mountain road expertise.</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#60A5FA', marginBottom: '4px' }}>📍 Flexible Stops</div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Pause for lunch, photo stops, or refreshments anytime.</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#60A5FA', marginBottom: '4px' }}>💳 Zero Advance Penalty</div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Cancel or reschedule up to 2 hours before trip starts.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Booking Box & Related Tours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Booking Form Box */}
            <div
              id="book-now-form"
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '24px',
                padding: '30px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              }}
            >
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF' }}>
                Book This Tour
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '0 0 20px' }}>
                Receive instant confirmation & chauffeur details.
              </p>

              {bookingSuccess ? (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <CheckCircle2 size={44} color="#10B981" style={{ marginBottom: '12px' }} />
                  <h4 style={{ color: '#10B981', fontSize: '1.2rem', margin: '0 0 8px' }}>
                    Booking Request Sent!
                  </h4>
                  <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 16px' }}>
                    Thank you, {customerName}. Our dispatch team has received your tour booking for {travelDate}. We are contacting you right away.
                  </p>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Book Another Trip
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                      YOUR NAME *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kulkarni"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#FFF',
                          fontSize: '0.925rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                      MOBILE NUMBER *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#FFF',
                          fontSize: '0.925rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                      TRAVEL DATE *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="date"
                        required
                        value={travelDate}
                        onChange={e => setTravelDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#FFF',
                          fontSize: '0.925rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                      PICKUP ADDRESS IN PUNE
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Kothrud, Pune / Baner / Viman Nagar"
                        value={pickupAddress}
                        onChange={e => setPickupAddress(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#FFF',
                          fontSize: '0.925rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                      SELECT CAB TYPE
                    </label>
                    <select
                      value={selectedVehicle}
                      onChange={e => setSelectedVehicle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: '#FFF',
                        fontSize: '0.925rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="sedan">Maruti Dzire / Etios (4 Seater AC)</option>
                      <option value="ertiga">Maruti Ertiga (6 Seater AC)</option>
                      <option value="innova">Toyota Innova Crysta (7 Seater Luxury)</option>
                      <option value="tempo">Tempo Traveller (13/17 Seater)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    style={{
                      marginTop: '8px',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                    }}
                  >
                    {bookingLoading ? 'Submitting Request...' : `Reserve Tour for ₹${tour.price ?? tour.starting_price}`}
                  </button>
                </form>
              )}
            </div>

            {/* Related Tours Sidebar */}
            {relatedTours.length > 0 && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', color: '#FFFFFF' }}>
                  Other Popular Holiday Packages
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {relatedTours.map(rt => (
                    <a
                      key={rt.id}
                      href={`#/tours/${rt.slug}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <img
                        src={getTourImage(rt)}
                        alt={rt.title}
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#F8FAFC',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {rt.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {rt.duration} • ₹{rt.price ?? rt.starting_price}
                        </div>
                      </div>
                      <ChevronRight size={16} color="#60A5FA" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
