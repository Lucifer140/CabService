import React from 'react';
import { Vehicle } from '../../../types';
import { Users, Briefcase, Zap, MessageCircle } from 'lucide-react';
import { FleetSkeleton } from '../../shared/Skeleton';
import { useLanguage } from '../../../i18n/LanguageContext';

interface FleetSectionProps {
  fleet: Vehicle[];
  isLoading?: boolean;
  onSelectVehicle?: (key: string) => void;
}

export const FleetSection: React.FC<FleetSectionProps> = ({
  fleet,
  isLoading = false,
  onSelectVehicle,
}) => {
  const { t } = useLanguage();
  const defaultFleet: Partial<Vehicle>[] = [
    {
      vehicle_key: 'dzire',
      name: 'Swift Dzire (Sedan)',
      category: 'Sedan',
      passenger_capacity: 4,
      luggage_capacity: '2 Bags',
      pricing_base: 2299,
      pricing_per_km: 14,
      description:
        'Clean, comfortable AC sedan. Perfect for executive Pune-Mumbai commute & small families.',
    },
    {
      vehicle_key: 'ertiga',
      name: 'Maruti Ertiga (New Modal)',
      category: 'MUV',
      passenger_capacity: 6,
      luggage_capacity: '3 Bags',
      pricing_base: 3199,
      pricing_per_km: 17,
      description:
        'Spacious 6-seater family MUV with dual AC and large boot space for Mumbai Airport luggage.',
    },
    {
      vehicle_key: 'innova',
      name: 'Innova Crysta (Premium SUV)',
      category: 'SUV',
      passenger_capacity: 7,
      luggage_capacity: '4 Bags',
      pricing_base: 4499,
      pricing_per_km: 21,
      description:
        'Ultimate highway comfort, plush reclining seats, unmatched safety for outstation tours.',
    },
    {
      vehicle_key: 'tempo',
      name: 'Tempo Traveller (Executive)',
      category: 'Minibus',
      passenger_capacity: 17,
      luggage_capacity: '10 Bags',
      pricing_base: 7499,
      pricing_per_km: 28,
      description:
        'Ideal for group pilgrimages to Shirdi, corporate outings & destination weddings.',
    },
  ];

  const displayList = fleet.length > 0 ? fleet : defaultFleet;

  return (
    <section
      id="fleet"
      style={{
        padding: 'clamp(50px, 8vw, 80px) clamp(16px, 3vw, 24px)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60A5FA',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          {t('fleet_badge', 'Premium Verified Cabs')}
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
            fontWeight: 800,
            margin: '0 0 12px 0',
            color: '#F8FAFC',
          }}
        >
          {t('fleet_title', 'Our Pune to Mumbai Fleet')}
        </h2>
        <p
          style={{
            color: '#94A3B8',
            fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {t('fleet_subtitle', 'All vehicles sanitized before every journey, equipped with fast tags & verified experienced drivers.')}
        </p>
      </div>

      {isLoading ? (
        <FleetSkeleton count={4} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
            gap: '24px',
          }}
        >
          {displayList.map((car, idx) => (
            <div
              key={car.vehicle_key || idx}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              <div>
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '14px',
                    height: '160px',
                    overflow: 'hidden',
                    marginBottom: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#0F172A',
                  }}
                >
                  <img
                    src={
                      car.image_url && car.image_url.startsWith('assets/')
                        ? car.image_url
                        : car.vehicle_key === 'innova'
                          ? 'assets/images/innova.png'
                          : car.vehicle_key === 'tempo'
                            ? 'assets/images/tempo.png'
                            : car.vehicle_key === 'ertiga'
                              ? 'assets/images/ertiga.png'
                              : 'assets/images/dzire.png'
                    }
                    alt={car.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.3s ease',
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:3.5rem;">🚗</div>`;
                      }
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                    {car.name}
                  </h3>
                  <span
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#93C5FD',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {car.category}
                  </span>
                </div>

                <p
                  style={{
                    color: '#94A3B8',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                  }}
                >
                  {car.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '14px',
                    marginBottom: '20px',
                    color: '#CBD5E1',
                    fontSize: '0.85rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="#60A5FA" />
                    <span>{car.passenger_capacity} Seats</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={16} color="#60A5FA" />
                    <span>
                      {String(car.luggage_capacity || '')
                        .toLowerCase()
                        .includes('bag')
                        ? car.luggage_capacity
                        : `${car.luggage_capacity} Bags`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color="#10B981" />
                    <span>Chilled AC</span>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Starting from</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
                      ₹{car.pricing_base}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Extra Distance</span>
                    <div style={{ fontSize: '0.9rem', color: '#E2E8F0', fontWeight: 600 }}>
                      ₹{car.pricing_per_km}/km
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectVehicle && car.vehicle_key) onSelectVehicle(car.vehicle_key);
                      const el = document.getElementById('booking-widget');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      padding: '11px 8px',
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {t('fleet_select_cab', 'Book Cab')}
                  </button>
                  <a
                    href={`https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20want%20to%20book%20${encodeURIComponent(car.name || 'Cab')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '11px 8px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      borderRadius: '10px',
                      color: '#4ADE80',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
