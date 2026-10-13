import React, { useState, useEffect } from 'react';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import {
  Search,
  CheckCircle2,
  Clock,
  Car,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  UserCheck,
} from 'lucide-react';

interface BookingStatusData {
  id: number;
  booking_ref: string;
  customer_name: string;
  customer_phone: string;
  trip_type: string;
  pickup_location: string;
  drop_location: string;
  travel_date: string;
  travel_time: string;
  vehicle_name: string;
  estimated_fare: number;
  final_amount: number | null;
  status: string;
  assigned_driver: string;
  driver_phone: string;
  created_at: string;
  updated_at: string;
  payment_status?: string;
  payment_id?: string;
}

const STATUS_STEPS = [
  { key: 'NEW', label: 'Booking Received', desc: 'Your trip request was placed successfully.' },
  { key: 'CONTACTED', label: 'Under Review', desc: 'Dispatch desk is scheduling the vehicle.' },
  { key: 'CONFIRMED', label: 'Ride Confirmed', desc: 'Trip schedule is locked in.' },
  { key: 'ASSIGNED', label: 'Driver Assigned', desc: 'Chauffeur and cab allotted.' },
  { key: 'IN_TRANSIT', label: 'In Transit', desc: 'Your trip is actively underway.' },
  { key: 'COMPLETED', label: 'Trip Completed', desc: 'Arrived at your destination safely.' },
];

export const TrackBookingPage: React.FC = () => {
  const [bookingRef, setBookingRef] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill from query params e.g. #/track-booking?ref=PTC-1234&phone=9876543210
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Track Your Cab Booking | Sangita Travels Pune';

    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const searchParams = new URLSearchParams(hash.slice(queryIndex));
      const refParam = searchParams.get('ref') || searchParams.get('id') || '';
      const phoneParam = searchParams.get('phone') || '';
      if (refParam) setBookingRef(refParam);
      if (phoneParam) setPhone(phoneParam);

      if (refParam && phoneParam) {
        fetchBookingStatus(refParam, phoneParam);
      }
    }
  }, []);

  const fetchBookingStatus = async (refVal: string, phoneVal: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/public/track-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_ref: refVal.trim(), phone: phoneVal.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.booking) {
        setBooking(data.booking);
      } else {
        setBooking(null);
        setError(data.error || 'No booking found matching this reference and mobile number.');
      }
    } catch (err: any) {
      console.error('Tracking fetch error:', err);
      setError('Unable to connect to the tracking server. Please check your network or call +91 8261021008.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRef.trim()) {
      setError('Please enter your Booking Reference (e.g. PTC-4821 or your booking ID).');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your 10-digit registered mobile number.');
      return;
    }
    fetchBookingStatus(bookingRef, phone);
  };

  const getStepIndex = (status: string) => {
    if (status === 'CANCELLED') return -1;
    const idx = STATUS_STEPS.findIndex(s => s.key === status);
    return idx !== -1 ? idx : 0;
  };

  const currentStepIdx = booking ? getStepIndex(booking.status) : 0;

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

      <main id="main-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Page Hero */}

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60A5FA',
              padding: '6px 16px',
              borderRadius: '24px',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <Clock size={16} /> Live Ride Telemetry
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 14px',
              color: '#FFFFFF',
            }}
          >
            Track Your Booking
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '1rem', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            Check real-time confirmation status, assigned chauffeur details, vehicle tracking, and download invoices for your Pune-Mumbai trip.
          </p>
        </div>

        {/* Tracking Search Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 32px)',
            marginBottom: '40px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          }}
        >
          <form
            onSubmit={handleTrackSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr)) auto',
              gap: '16px',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                BOOKING REFERENCE / ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PTC-4821 or 12"
                value={bookingRef}
                onChange={e => setBookingRef(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#FFF',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                REGISTERED PHONE NUMBER *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#FFF',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                height: '48px',
                padding: '0 28px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                border: 'none',
                borderRadius: '12px',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <Search size={18} /> {loading ? 'Searching...' : 'Track Ride'}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </div>

        {/* Booking Details Container */}
        {booking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Status Timeline */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: 'clamp(20px, 4vw, 36px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>REFERENCE NUMBER</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60A5FA' }}>
                    {booking.booking_ref}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background:
                      booking.status === 'COMPLETED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : booking.status === 'CANCELLED'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                    color:
                      booking.status === 'COMPLETED'
                        ? '#34D399'
                        : booking.status === 'CANCELLED'
                          ? '#F87171'
                          : '#60A5FA',
                    border: `1px solid ${
                      booking.status === 'COMPLETED'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : booking.status === 'CANCELLED'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(59, 130, 246, 0.3)'
                    }`,
                  }}
                >
                  ● {booking.status}
                </div>
              </div>

              {/* Timeline Steps Bar */}
              {booking.status === 'CANCELLED' ? (
                <div
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    textAlign: 'center',
                    color: '#F87171',
                  }}
                >
                  <AlertCircle size={36} style={{ marginBottom: '8px' }} />
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>This Booking Has Been Cancelled</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#CBD5E1' }}>
                    If you have questions regarding refund or rescheduling, please contact our 24/7 help desk.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '12px',
                    position: 'relative',
                  }}
                >
                  {STATUS_STEPS.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          padding: '12px 8px',
                          borderRadius: '14px',
                          background: isCurrent ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                          border: isCurrent ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isPassed ? '#2563EB' : 'rgba(255, 255, 255, 0.06)',
                            border: `2px solid ${isPassed ? '#60A5FA' : 'rgba(255, 255, 255, 0.1)'}`,
                            color: isPassed ? '#FFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            marginBottom: '10px',
                          }}
                        >
                          {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: isCurrent ? 800 : 600,
                            color: isPassed ? '#F8FAFC' : '#64748B',
                            marginBottom: '4px',
                          }}
                        >
                          {step.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.3 }}>
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trip Details & Driver Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                gap: '24px',
              }}
            >
              {/* Trip Information */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '28px',
                }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 20px', color: '#FFFFFF' }}>
                  Trip Itinerary & Vehicle
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <MapPin size={18} color="#10B981" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>PICKUP LOCATION</div>
                      <div style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 600 }}>
                        {booking.pickup_location}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <MapPin size={18} color="#EF4444" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>DROP DESTINATION</div>
                      <div style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 600 }}>
                        {booking.drop_location}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Calendar size={18} color="#60A5FA" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>DATE & TIME</div>
                      <div style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 600 }}>
                        {booking.travel_date} at {booking.travel_time || 'Flexible'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Car size={18} color="#FBBF24" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>SELECTED VEHICLE</div>
                      <div style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 600 }}>
                        {booking.vehicle_name} (AC Clean Cab)
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>ESTIMATED FARE</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
                        ₹{booking.final_amount ?? booking.estimated_fare}
                      </span>
                    </div>

                    <a
                      href={`/api/bookings/${booking.id}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#93C5FD',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      <FileText size={15} /> View Tax Invoice
                    </a>
                  </div>
                </div>
              </div>

              {/* Chauffeur Assignment Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px', color: '#FFFFFF' }}>
                    Chauffeur Assignment
                  </h3>

                  {booking.assigned_driver && booking.assigned_driver !== 'Unassigned' ? (
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF',
                          }}
                        >
                          <UserCheck size={24} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>
                            {booking.assigned_driver}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 600 }}>
                            ● Verified Commercial Chauffeur
                          </div>
                        </div>
                      </div>

                      {booking.driver_phone && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <a
                            href={`tel:+91${booking.driver_phone}`}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '10px 14px',
                              background: '#2563EB',
                              borderRadius: '10px',
                              color: '#FFF',
                              textDecoration: 'none',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                            }}
                          >
                            <Phone size={15} /> Call Driver
                          </a>
                          <a
                            href={`https://wa.me/91${booking.driver_phone}?text=Hello%20${encodeURIComponent(booking.assigned_driver)},%20I%20am%20${encodeURIComponent(booking.customer_name)}%20(Ref:%20${booking.booking_ref})`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '10px 14px',
                              background: '#25D366',
                              borderRadius: '10px',
                              color: '#000',
                              textDecoration: 'none',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                            }}
                          >
                            <MessageCircle size={15} /> WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '24px 20px',
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center',
                        color: '#94A3B8',
                        marginBottom: '20px',
                      }}
                    >
                      <Clock size={32} color="#60A5FA" style={{ marginBottom: '10px' }} />
                      <div style={{ fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
                        Driver Assignment in Progress
                      </div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                        Our central dispatch desk assigns your driver and vehicle plate number 2 to 4 hours prior to scheduled departure.
                      </div>
                    </div>
                  )}
                </div>

                {/* 24/7 Operations Desk Help */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '8px' }}>
                    Need to modify pickup time or route?
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href="tel:+918261021008"
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        borderRadius: '8px',
                        color: '#93C5FD',
                        textDecoration: 'none',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Call +91 8261021008
                    </a>
                    <a
                      href={`https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20regarding%20booking%20ref%20${booking.booking_ref}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(37, 211, 102, 0.15)',
                        borderRadius: '8px',
                        color: '#34D399',
                        textDecoration: 'none',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      WhatsApp Help
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
