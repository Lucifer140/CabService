import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../../../services/api';
import { Vehicle, PricingRule } from '../../../types';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  MessageSquare,
  Mail,
  User,
  Phone,
  AlertCircle,
  Users,
  Navigation,
  Tag,
} from 'lucide-react';
import { PaymentWidget } from './PaymentWidget';
import { useLanguage } from '../../../i18n/LanguageContext';



interface BookingWidgetProps {
  onBookingSuccess?: (ref: string) => void;
  selectedVehicleKey?: string;
  fleet?: Vehicle[];
  pricingRules?: PricingRule[];
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({
  onBookingSuccess,
  selectedVehicleKey,
  fleet = [],
  pricingRules = [],
}) => {
  const { t } = useLanguage();
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'airport' | 'outstation'>(
    'oneway'
  );
  const [pickup, setPickup] = useState('Pune');
  const [drop, setDrop] = useState('Mumbai Airport T2');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [date, setDate] = useState(tomorrowStr);
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('06:00 AM');
  const [vehicle, setVehicle] = useState(selectedVehicleKey || 'dzire');
  const [passengers, setPassengers] = useState(4);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    finalFare: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id?: number;
    ref: string;
    fare: number;
    phone: string;
    route: string;
    date: string;
    vehicleName: string;
    returnDate?: string | null;
  } | null>(null);
  const [showPayment, setShowPayment] = useState(false);


  const [routeInfo, setRouteInfo] = useState<{
    distance_km: number;
    duration_text: string;
  }>({
    distance_km: 152,
    duration_text: '3h 15m via Expressway',
  });

  const PUNE_LOCATIONS = [
    'Pune Airport (PNQ)',
    'Hinjewadi Phase 1, Pune',
    'Kothrud / Karve Nagar, Pune',
    'Viman Nagar, Pune',
    'Shivajinagar, Pune',
    'Baner / Balewadi, Pune',
    'Wakad / Pimple Saudagar, Pune',
    'Hadapsar / Magarpatta, Pune',
    'Kharadi / EON IT Park, Pune',
    'Swargate, Pune',
  ];

  const MUMBAI_LOCATIONS = [
    'Mumbai Airport T2 (CSMIA)',
    'Mumbai Airport T1 (Domestic)',
    'Dadar Central, Mumbai',
    'Bandra Kurla Complex (BKC)',
    'Borivali West, Mumbai',
    'Chhatrapati Shivaji Maharaj Terminus (CSMT)',
    'Navi Mumbai (Vashi / Kharghar)',
    'Thane West, Mumbai',
    'Andheri East / SEEPZ, Mumbai',
    'Colaba / Nariman Point, Mumbai',
  ];

  // Fetch real-time distance from backend
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      if (pickup.trim().length >= 3 && drop.trim().length >= 3) {
        try {
          const res = await api.get<{
            success: boolean;
            route: { distance_km: number; duration_text: string };
          }>(
            `/api/public/route-distance?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`
          );
          if (isMounted && res.success && res.route) {
            setRouteInfo(res.route);
          }
        } catch {
          // fallback to default
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pickup, drop]);

  // Sync when selectedVehicleKey prop changes without triggering cascading render effect
  const [prevVehicleKey, setPrevVehicleKey] = useState(selectedVehicleKey);
  if (selectedVehicleKey && selectedVehicleKey !== prevVehicleKey) {
    setPrevVehicleKey(selectedVehicleKey);
    setVehicle(selectedVehicleKey);
  }

  // Default fleet fallback if backend fleet is not yet loaded
  const defaultFleet: Partial<Vehicle>[] = useMemo(
    () => [
      {
        vehicle_key: 'dzire',
        name: 'Swift Dzire (Sedan)',
        category: 'Sedan',
        passenger_capacity: 4,
        luggage_capacity: '2 Bags',
        pricing_base: 2299,
        pricing_per_km: 14,
      },
      {
        vehicle_key: 'ertiga',
        name: 'Maruti Ertiga (New Modal)',
        category: 'MUV',
        passenger_capacity: 6,
        luggage_capacity: '3 Bags',
        pricing_base: 3199,
        pricing_per_km: 17,
      },
      {
        vehicle_key: 'innova',
        name: 'Innova Crysta (Premium SUV)',
        category: 'SUV',
        passenger_capacity: 7,
        luggage_capacity: '4 Bags',
        pricing_base: 4499,
        pricing_per_km: 21,
      },
      {
        vehicle_key: 'tempo',
        name: 'Tempo Traveller (Executive)',
        category: 'Minibus',
        passenger_capacity: 17,
        luggage_capacity: '10 Bags',
        pricing_base: 7499,
        pricing_per_km: 28,
      },
    ],
    []
  );

  const displayFleet = fleet.length > 0 ? fleet : (defaultFleet as Vehicle[]);

  // Current selected vehicle entity
  const selectedVehicleObj = useMemo(() => {
    return displayFleet.find(v => v.vehicle_key === vehicle) || displayFleet[0];
  }, [displayFleet, vehicle]);

  // Adjust passengers if exceeds vehicle capacity
  const maxSeats = selectedVehicleObj?.passenger_capacity || 4;

  // Real-time Dynamic Fare Calculation Engine
  const calculateFare = (
    vKey: string,
    tType: 'oneway' | 'roundtrip' | 'airport' | 'outstation',
    pick: string,
    drp: string
  ): number => {
    const rule = pricingRules.find(r => r.vehicle_key === vKey);
    const veh = displayFleet.find(v => v.vehicle_key === vKey);

    const isAirport =
      tType === 'airport' ||
      pick.toLowerCase().includes('airport') ||
      drp.toLowerCase().includes('airport');

    if (rule) {
      if (tType === 'roundtrip') {
        const billedKm = Math.max(routeInfo.distance_km * 2, 300);
        const dynamicCalc = billedKm * rule.per_km + rule.driver_allowance * 1.5 + 320 * 2;
        return Math.round(Math.max(rule.roundtrip_base || 4500, dynamicCalc));
      }
      if (isAirport) {
        return Math.round(rule.airport_rate || rule.oneway_pune_mumbai);
      }
      if (tType === 'outstation') {
        const billedKm = Math.max(routeInfo.distance_km, rule.min_km);
        const dynamicCalc = billedKm * rule.per_km + rule.driver_allowance + 320;
        return Math.round(Math.max(rule.oneway_pune_mumbai * 1.2, dynamicCalc));
      }
      return Math.round(rule.oneway_pune_mumbai);
    }

    // Fallback using vehicle pricing base
    const base =
      veh?.pricing_base ||
      (vKey === 'tempo' ? 7499 : vKey === 'innova' ? 4499 : vKey === 'ertiga' ? 3199 : 2299);
    if (tType === 'roundtrip') return Math.round(base * 1.85);
    if (tType === 'outstation') return Math.round(base * 1.5);
    return Math.round(base);
  };

  const currentFare = useMemo(() => {
    return calculateFare(vehicle, tripType, pickup, drop);
  }, [vehicle, tripType, pickup, drop, pricingRules, displayFleet, routeInfo.distance_km]);

  const effectiveFare = useMemo(() => {
    if (!appliedCoupon) return currentFare;
    return appliedCoupon.finalFare;
  }, [currentFare, appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setIsValidatingCoupon(true);
    try {
      const res = await api.post<{
        success: boolean;
        valid: boolean;
        discount?: number;
        final_fare?: number;
        message?: string;
      }>('/api/public/validate-coupon', {
        code: couponCode.trim(),
        fare: currentFare,
      });
      if (res.valid && res.discount !== undefined) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discount: res.discount,
          finalFare: res.final_fare || Math.max(0, currentFare - res.discount),
          message: res.message || `Saved ₹${res.discount}!`,
        });
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(res.message || 'Invalid coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate promo code.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };


  // Handle Travel Date Change (keep returnDate >= date)
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (returnDate < newDate) {
      setReturnDate(newDate);
    }
  };

  // Form Submission & Validation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const cleanEmail = customerEmail.trim();

    // 1. Validation checks
    if (!cleanName || cleanName.length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number for driver SMS.');
      return;
    }

    if (!pickup.trim() || !drop.trim()) {
      setFormError('Please provide both pickup and drop addresses.');
      return;
    }

    if (date < todayStr) {
      setFormError('Travel date cannot be in the past.');
      return;
    }

    if (tripType === 'roundtrip' && returnDate < date) {
      setFormError('Return date cannot be before travel date.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address or leave blank.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{
        success: boolean;
        booking_ref: string;
        booking_id?: number;
        message: string;
        whatsapp_url?: string;
        whatsapp_sent?: boolean;
      }>('/api/bookings', {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        pickup: pickup.trim(),
        drop: drop.trim(),
        date,
        time,
        return_date: tripType === 'roundtrip' ? returnDate : null,
        trip_type: tripType,
        vehicle,
        passengers,
        fare: effectiveFare,
        coupon: appliedCoupon?.code || '',
      });

      if (res.success && res.booking_ref) {
        setConfirmedBooking({
          id: res.booking_id,
          ref: res.booking_ref,
          fare: effectiveFare,
          phone: cleanPhone,
          route: `${pickup} ➔ ${drop}`,
          date,
          vehicleName: selectedVehicleObj?.name || vehicle.toUpperCase(),
          returnDate: tripType === 'roundtrip' ? returnDate : null,
        });
        setShowPayment(false);


        if (onBookingSuccess) onBookingSuccess(res.booking_ref);

        if (res.whatsapp_url) {
          window.open(res.whatsapp_url, '_blank');
        } else {
          // Pre-fill WhatsApp confirmation message fallback
          const returnInfo = tripType === 'roundtrip' ? `\nReturn Date: ${returnDate}` : '';
          const waText = encodeURIComponent(
            `Namaste Sangita Travels! I have booked a cab on your website.\n` +
              `Booking Ref: ${res.booking_ref}\n` +
              `Route: ${pickup} to ${drop}\n` +
              `Travel Date: ${date} (${time})${returnInfo}\n` +
              `Vehicle: ${selectedVehicleObj?.name || vehicle.toUpperCase()} (${passengers} Pax)\n` +
              `Guaranteed Fare: ₹${currentFare}\n` +
              `Customer: ${cleanName} (${cleanPhone})\n` +
              `Please confirm my driver allocation!`
          );
          window.open(`https://wa.me/918261021008?text=${waText}`, '_blank');
        }
      }
    } catch (err: any) {
      setFormError(
        err.message ||
          'Could not complete booking right now. Please call (+91) 8261021008 for instant dispatch.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: 'clamp(18px, 3.5vw, 32px)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
        color: '#F8FAFC',
        maxWidth: '960px',
        margin: '0 auto',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Trip Type Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px',
          marginBottom: '22px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { id: 'oneway', label: t('tab_oneway', 'One Way Drop') },
          { id: 'roundtrip', label: t('tab_roundtrip', 'Round Trip') },
          { id: 'airport', label: t('tab_airport', 'Airport Transfer') },
          { id: 'outstation', label: 'Outstation Tour' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTripType(tab.id as any)}
            style={{
              padding: '8px clamp(12px, 2vw, 18px)',
              borderRadius: '10px',
              border: tripType === tab.id ? '1px solid #3B82F6' : '1px solid transparent',
              background: tripType === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: tripType === tab.id ? '#93C5FD' : '#94A3B8',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {confirmedBooking ? (
        /* Booking Confirmation Receipt */
        <div style={{ textAlign: 'center', padding: '24px 10px' }}>
          <div style={{ color: '#10B981', marginBottom: '14px' }}>
            <CheckCircle2 size={58} style={{ margin: '0 auto' }} />
          </div>
          <h3
            style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
              fontWeight: 800,
              margin: '0 0 8px 0',
              color: '#F8FAFC',
            }}
          >
            Cab Booking Confirmed!
          </h3>
          <p
            style={{
              color: '#94A3B8',
              fontSize: '0.95rem',
              maxWidth: '520px',
              margin: '0 auto 20px',
              lineHeight: 1.5,
            }}
          >
            Your trip reference is{' '}
            <strong style={{ color: '#60A5FA', fontSize: '1.05rem' }}>
              {confirmedBooking.ref}
            </strong>
            . Driver details will be dispatched via SMS & WhatsApp.
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '440px',
              margin: '0 auto 24px',
              textAlign: 'left',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>Route:</span>
              <strong style={{ color: '#F8FAFC' }}>{confirmedBooking.route}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>Travel Date:</span>
              <span style={{ color: '#F8FAFC' }}>{confirmedBooking.date}</span>
            </div>
            {confirmedBooking.returnDate && (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span style={{ color: '#94A3B8' }}>Return Date:</span>
                <span style={{ color: '#60A5FA' }}>{confirmedBooking.returnDate}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>Vehicle:</span>
              <span style={{ color: '#F8FAFC' }}>{confirmedBooking.vehicleName}</span>
            </div>
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '12px',
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ color: '#94A3B8' }}>Guaranteed Fare:</span>
              <strong style={{ color: '#10B981', fontSize: '1.3rem' }}>
                ₹{confirmedBooking.fare}
              </strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>
              * Includes Toll Tax, AC Cab, Fuel & Driver Allowance. Pay directly to driver.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setConfirmedBooking(null)}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Book Another Ride
            </button>
            <a
              href={`tel:+91${confirmedBooking.phone}`}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Call Dispatch Office
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(confirmedBooking.route.split('➔')[0].trim())}&destination=${encodeURIComponent(confirmedBooking.route.split('➔')[1]?.trim() || 'Mumbai')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px 20px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                color: '#93C5FD',
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Navigation size={15} /> View GPS Route on Google Maps ↗
            </a>
            {!showPayment && (
              <button
                type="button"
                onClick={() => setShowPayment(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                }}
              >
                💳 Pay Advance (₹500) Online
              </button>
            )}
          </div>

          {showPayment && confirmedBooking.id && (
            <PaymentWidget
              bookingId={confirmedBooking.id}
              bookingRef={confirmedBooking.ref}
              totalFare={confirmedBooking.fare}
              customerName={customerName}
              customerPhone={customerPhone}
              onClose={() => setShowPayment(false)}
            />
          )}
        </div>
      ) : (
        /* Interactive Booking Form */
        <form onSubmit={handleBookingSubmit}>
          {formError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '18px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Pickup, Drop, Date, Time & Optional Return Date */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                tripType === 'roundtrip'
                  ? 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))'
                  : 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
            {/* Pickup */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_pickup', 'Pickup Location')} *
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#3B82F6' }}
                />
                <input
                  type="text"
                  list="pune-locations"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                  placeholder="e.g. Pune City / Hinjewadi"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <datalist id="pune-locations">
                  {PUNE_LOCATIONS.map(loc => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Drop */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_drop', 'Drop Location')} *
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#10B981' }}
                />
                <input
                  type="text"
                  list="mumbai-locations"
                  value={drop}
                  onChange={e => setDrop(e.target.value)}
                  placeholder="e.g. Mumbai Airport T2"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <datalist id="mumbai-locations">
                  {MUMBAI_LOCATIONS.map(loc => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Travel Date */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_travel_date', 'Travel Date')} *
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }}
                />
                <input
                  type="date"
                  value={date}
                  min={todayStr}
                  onChange={e => handleDateChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Return Date (Shown only for Round Trip) */}
            {tripType === 'roundtrip' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    color: '#60A5FA',
                    marginBottom: '6px',
                    fontWeight: 700,
                  }}
                >
                  {t('lbl_return_date', 'Return Date')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar
                    size={18}
                    style={{ position: 'absolute', left: '12px', top: '12px', color: '#60A5FA' }}
                  />
                  <input
                    type="date"
                    value={returnDate}
                    min={date}
                    onChange={e => setReturnDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '10px',
                      color: '#93C5FD',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Time */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_pickup_time', 'Pickup Time')} *
              </label>
              <div style={{ position: 'relative' }}>
                <Clock
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }}
                />
                <input
                  type="text"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="e.g. 06:00 AM"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Live Route Distance & Duration Preview Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 16px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '12px',
              fontSize: '0.82rem',
              color: '#93C5FD',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={15} style={{ color: '#60A5FA' }} />
              <span>
                Calculated Route:{' '}
                <strong style={{ color: '#FFFFFF', fontSize: '0.9rem' }}>
                  {routeInfo.distance_km} km
                </strong>{' '}
                • <span style={{ color: '#BFDBFE' }}>{routeInfo.duration_text}</span>
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', gap: '12px' }}>
              <span>✓ All Expressway Tolls Included</span>
              <span>✓ Doorstep Pickup & Drop</span>
            </div>
          </div>

          {/* Row 2: Dynamic Vehicle Selection & Passengers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
            {/* Dynamic Vehicle Dropdown */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_vehicle', 'Choose Vehicle')} *
              </label>
              <div style={{ position: 'relative' }}>
                <Car
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#60A5FA' }}
                />
                <select
                  value={vehicle}
                  onChange={e => {
                    const newKey = e.target.value;
                    setVehicle(newKey);
                    const vObj = displayFleet.find(v => v.vehicle_key === newKey);
                    if (vObj && passengers > vObj.passenger_capacity) {
                      setPassengers(vObj.passenger_capacity);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  {displayFleet.map(car => {
                    const dynamicRate = calculateFare(car.vehicle_key, tripType, pickup, drop);
                    return (
                      <option key={car.vehicle_key} value={car.vehicle_key}>
                        {car.name} ({car.category}, {car.passenger_capacity} Seater) — ₹
                        {dynamicRate}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Passengers Count */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_passengers', 'Passengers')}
              </label>
              <div style={{ position: 'relative' }}>
                <Users
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }}
                />
                <select
                  value={passengers}
                  onChange={e => setPassengers(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  {Array.from({ length: maxSeats }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Name, Mobile Number, Email Address */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '14px',
              marginBottom: '22px',
            }}
          >
            {/* Customer Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_name', 'Your Full Name')} *
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }}
                />
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_phone', 'Mobile Number')} *
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#10B981' }}
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}
              >
                {t('lbl_email', 'Email Address (Optional)')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }}
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="For trip receipt / invoice"
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Promo Code / Coupon Section */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} color="#3B82F6" />
              <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                {t('lbl_promo_code', 'Have a Promo Code?')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      color: '#6EE7B7',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    ✓ {appliedCoupon.code} (-₹{appliedCoupon.discount})
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PUNEMUMBAI100"
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      outline: 'none',
                      width: '180px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    style={{
                      padding: '6px 14px',
                      background: '#2563EB',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: isValidatingCoupon || !couponCode.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isValidatingCoupon ? 'Checking...' : t('btn_apply', 'Apply')}
                  </button>
                </div>
              )}
            </div>
            {couponError && (
              <div style={{ width: '100%', color: '#FCA5A5', fontSize: '0.75rem', marginTop: '2px' }}>
                {couponError}
              </div>
            )}
          </div>

          {/* Action & Real-Time Fare Bar */}
          <div
            className="booking-action-bar"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(30, 41, 59, 0.65)',
              padding: '16px 20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Guaranteed All-Inclusive Fare
              </div>
              <div
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
                  fontWeight: 800,
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {appliedCoupon && (
                  <span
                    style={{
                      textDecoration: 'line-through',
                      color: '#64748B',
                      fontSize: '1.2rem',
                    }}
                  >
                    ₹{currentFare}
                  </span>
                )}
                <span>₹{effectiveFare}</span>
                {appliedCoupon && (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#6EE7B7',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    Save ₹{appliedCoupon.discount}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#94A3B8',
                    fontWeight: 500,
                  }}
                >
                  (Toll, AC & Driver Included)
                </span>
              </div>
            </div>

            <div
              className="booking-action-buttons"
              style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '13px 26px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '46px',
                }}
              >
                <span>{isSubmitting ? 'Confirming Cab...' : `${t('btn_confirm_booking', 'Book Cab Now')} →`}</span>
              </button>

              <a
                href={`https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20want%20to%20book%20a%20cab%20from%20${encodeURIComponent(pickup)}%20to%20${encodeURIComponent(drop)}%20for%20₹${currentFare}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '13px 20px',
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  borderRadius: '12px',
                  color: '#4ADE80',
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '46px',
                }}
              >
                <MessageSquare size={18} />
                <span>WhatsApp Quote</span>
              </a>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
