import React from 'react';
import { Tour } from '../../../types';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { ToursSkeleton } from '../../shared/Skeleton';
import { useLanguage } from '../../../i18n/LanguageContext';

interface ToursSectionProps {
  tours: Tour[];
  isLoading?: boolean;
}

export const ToursSection: React.FC<ToursSectionProps> = ({ tours, isLoading = false }) => {
  const { t } = useLanguage();
  const defaultTours: Partial<Tour>[] = [
    {
      title: 'Mahabaleshwar & Panchgani Tour',
      destination: 'Mahabaleshwar',
      duration: '2 Days / 1 Night',
      price: 5499,
      starting_price: 5499,
      itinerary: 'Strawberry farms, Arthur Seat, Venna Lake & scenic hill viewpoints.',
      description: 'Strawberry farms, Arthur Seat, Venna Lake & scenic hill viewpoints.',
    },
    {
      title: 'Shirdi Sai Baba Darshan',
      destination: 'Shirdi',
      duration: 'Same Day / 2 Days',
      price: 4999,
      starting_price: 4999,
      itinerary: 'Comfortable VIP pilgrimage trip directly from Pune to Shirdi temple.',
      description: 'Comfortable VIP pilgrimage trip directly from Pune to Shirdi temple.',
    },
    {
      title: 'Lonavala & Khandala Ghat Tour',
      destination: 'Lonavala',
      duration: 'Same Day Trip',
      price: 2999,
      starting_price: 2999,
      itinerary: 'Tiger Point, Bhushi Dam, Karla Caves & Wax Museum weekend gateway.',
      description: 'Tiger Point, Bhushi Dam, Karla Caves & Wax Museum weekend gateway.',
    },
    {
      title: 'Trimbakeshwar & Nashik Jyotirlinga',
      destination: 'Nashik',
      duration: '2 Days / 1 Night',
      price: 6199,
      starting_price: 6199,
      itinerary: 'Sacred Trimbakeshwar Jyotirlinga temple, Panchavati & Sula Vineyards.',
      description: 'Sacred Trimbakeshwar Jyotirlinga temple, Panchavati & Sula Vineyards.',
    },
  ];

  const displayTours = tours.length > 0 ? tours : defaultTours;

  return (
    <section
      id="tours"
      style={{
        padding: 'clamp(50px, 8vw, 80px) clamp(16px, 3vw, 24px)',
        background: 'rgba(15, 23, 42, 0.4)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}
          >
            {t('tours_badge', 'Outstation Packages')}
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
              fontWeight: 800,
              margin: '0 0 12px 0',
              color: '#F8FAFC',
            }}
          >
            {t('tours_title', 'Popular Holiday & Pilgrimage Tours')}
          </h2>
          <p
            style={{
              color: '#94A3B8',
              fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {t('tours_subtitle', 'All-inclusive tour packages with doorstep pickup and drop anywhere in Pune.')}
          </p>
        </div>

        {isLoading ? (
          <ToursSkeleton count={4} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
              gap: '24px',
            }}
          >
            {displayTours.map((tour, idx) => (
              <div
                key={tour.id || idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <div>
                  <div
                    style={{
                      height: '140px',
                      borderRadius: '14px',
                      position: 'relative',
                      overflow: 'hidden',
                      marginBottom: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: '#0F172A',
                    }}
                  >
                    <img
                      src={
                        tour.cover_image && tour.cover_image.startsWith('assets/')
                          ? tour.cover_image
                          : tour.slug && tour.slug.includes('shirdi')
                            ? 'assets/images/tours/shirdi.jpg'
                            : tour.slug && tour.slug.includes('jyotirlinga')
                              ? 'assets/images/tours/jyotirlinga.jpg'
                              : tour.slug && tour.slug.includes('lonavala')
                                ? 'assets/images/tours/lonavala.jpg'
                                : tour.slug && tour.slug.includes('ashtavinayak')
                                  ? 'assets/images/tours/ashtavinayak.jpg'
                                  : tour.slug && tour.slug.includes('goa')
                                    ? 'assets/images/tours/goa.jpg'
                                    : 'assets/images/tours/mahabaleshwar.jpg'
                      }
                      alt={tour.title}
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
                          target.parentElement.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🏔️</div>`;
                        }
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '8px',
                      color: '#60A5FA',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {tour.destination}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {tour.duration}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#F8FAFC',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {tour.title}
                  </h3>
                  <p
                    style={{
                      color: '#94A3B8',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      marginBottom: '20px',
                    }}
                  >
                    {tour.itinerary || tour.description}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Package From</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>
                      ₹{tour.price ?? tour.starting_price}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a
                      href={`#/tours/${tour.slug || tour.id}`}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#E2E8F0',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {t('tours_view_details', 'Details')}
                    </a>
                    <a
                      href={`https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20want%20to%20enquire%20about%20${encodeURIComponent(tour.title || 'Tour')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#93C5FD',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Book <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
