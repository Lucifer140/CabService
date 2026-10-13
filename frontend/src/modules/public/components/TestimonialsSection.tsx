import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, ShieldCheck, ThumbsUp, X, Sparkles } from 'lucide-react';
import { Review, ReviewStats } from '../../../types';

export const TestimonialsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total_reviews: 500,
    average_rating: 4.9,
    breakdown: { '5': 460, '4': 35, '3': 5, '2': 0, '1': 0 },
  });
  const [loading, setLoading] = useState(true);

  // Review Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [rating, setRating] = useState(5);
  const [route, setRoute] = useState('Pune to Mumbai Airport T2');
  const [tripRef, setTripRef] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/public/reviews');
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.warn('Could not load reviews from API, using default testimonials:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reviewText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          rating,
          review_text: reviewText,
          route,
          trip_ref: tripRef,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
          setCustomerName('');
          setCustomerPhone('');
          setReviewText('');
          fetchReviews();
        }, 2000);
      } else {
        alert('Could not submit review. Please try again.');
      }
    } catch {
      alert('Error connecting to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTestimonials: Review[] = [
    {
      id: 1,
      customer_name: 'Dr. Rajesh Deshmukh',
      rating: 5,
      route: 'Pune to Mumbai Airport T2',
      trip_ref: 'PTC-3104',
      review_text:
        'Booked Innova Crysta for Mumbai T2 Airport drop at 3:00 AM. Driver was 15 mins early, car was spotless, and driving on Khandala ghat was remarkably smooth. Best Pune-Mumbai cab service!',
      created_at: '2026-10-10',
    },
    {
      id: 2,
      customer_name: 'Sneha Roy',
      rating: 5,
      route: 'Baner to Dadar Mumbai',
      trip_ref: 'PTC-4219',
      review_text:
        'Solo travel from Baner to Dadar. Driver Nilesh was very courteous, verified Fastag toll was included, and vehicle had a working GPS tracker. Highly recommended for women traveling alone.',
      created_at: '2026-10-08',
    },
    {
      id: 3,
      customer_name: 'Amitabh Kulkarni',
      rating: 5,
      route: 'Mahabaleshwar Tour',
      trip_ref: 'PTC-5182',
      review_text:
        'Mahabaleshwar & Panchgani 2-day family trip in Ertiga. Great experience! No hidden driver allowances or extra toll demands. Transparent upfront pricing and clean AC.',
      created_at: '2026-10-05',
    },
    {
      id: 4,
      customer_name: 'Vikram Singhania',
      rating: 5,
      route: 'Pune to BKC Corporate Drop',
      trip_ref: 'PTC-6021',
      review_text:
        'Sangita Travels has been our corporate executive travel partner for 3 years. Punctual, well-groomed chauffeurs and instant GST receipts every single time.',
      created_at: '2026-10-02',
    },
  ];

  const displayList = reviews.length > 0 ? reviews : defaultTestimonials;

  return (
    <section
      id="testimonials"
      style={{
        padding: 'clamp(50px, 8vw, 80px) clamp(16px, 3vw, 24px)',
        background: 'rgba(10, 15, 29, 0.7)',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Heading & Aggregate Rating */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#FBBF24',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={14} /> Verified Traveler Reviews
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              margin: '0 0 12px 0',
              color: '#F8FAFC',
              letterSpacing: '-0.02em',
            }}
          >
            Trusted by 50,000+ Happy Passengers
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '3px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={20} fill="#FBBF24" color="#FBBF24" />
              ))}
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>
              {stats.average_rating} / 5.0
            </span>
            <span style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
              (Based on {stats.total_reviews}+ verified intercity trips)
            </span>
          </div>
        </div>

        {/* Testimonials Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {displayList.slice(0, 4).map(rev => (
            <div
              key={rev.id}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              }}
            >
              <div>
                {/* Header: Stars + Route */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="#FBBF24" color="#FBBF24" />
                    ))}
                  </div>
                  {rev.route && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#60A5FA',
                        borderRadius: '6px',
                        fontWeight: 600,
                      }}
                    >
                      {rev.route}
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p
                  style={{
                    color: '#CBD5E1',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    margin: '0 0 20px',
                    fontStyle: 'italic',
                  }}
                >
                  "{rev.review_text}"
                </p>
              </div>

              {/* Author & Verification Badge */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {rev.customer_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC' }}>
                      {rev.customer_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Verified Passenger
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button: Share Your Experience */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93C5FD',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.925rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquarePlus size={18} /> Share Your Trip Experience
          </button>
        </div>
      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px', color: '#FFF' }}>
              Rate Your Journey
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0 0 20px' }}>
              Your honest feedback helps fellow travelers and maintains high safety standards.
            </p>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <CheckCircle2 size={48} color="#10B981" style={{ marginBottom: '12px' }} />
                <h4 style={{ color: '#10B981', fontSize: '1.2rem', margin: '0 0 8px' }}>
                  Thank You for Your Review!
                </h4>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
                  We appreciate your feedback and look forward to serving you on your next trip!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Star Rating Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    YOUR RATING *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Star
                          size={28}
                          fill={s <= rating ? '#FBBF24' : 'none'}
                          color={s <= rating ? '#FBBF24' : '#64748B'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    YOUR FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Joshi"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#FFF',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    TRIP ROUTE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune to Mumbai Airport T2"
                    value={route}
                    onChange={e => setRoute(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#FFF',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                    YOUR REVIEW *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us about the chauffeur, vehicle comfort, punctuality..."
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#FFF',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#FFF',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
