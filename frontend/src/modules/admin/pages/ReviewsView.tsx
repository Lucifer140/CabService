import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Review, ReviewStats } from '../../../types';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Filter,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterApproved, setFilterApproved] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, [filterApproved]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      let url = '/api/reviews';
      if (filterApproved === '1' || filterApproved === '0') {
        url += `?is_approved=${filterApproved}`;
      }
      const data: any = await api.get(url);
      if (data && data.reviews) {
        setReviews(data.reviews);
      }
      if (data && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApprove = async (id: number, currentApproved: number) => {
    setActionLoading(id);
    const newStatus = currentApproved === 1 ? 0 : 1;
    try {
      await api.post(`/api/reviews/${id}/approve`, { is_approved: newStatus });
      setReviews(prev =>
        prev.map(r => (r.id === id ? { ...r, is_approved: newStatus } : r))
      );
    } catch (err) {
      alert('Failed to update review status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/api/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete review.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.customer_name.toLowerCase().includes(term) ||
      r.review_text.toLowerCase().includes(term) ||
      (r.route && r.route.toLowerCase().includes(term)) ||
      (r.trip_ref && r.trip_ref.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
          <MessageSquare size={16} /> REVIEWS & RATINGS MODERATION
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
          Customer Testimonials
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '4px 0 0' }}>
          Moderate and verify authentic customer feedback displayed on the public site and marketing funnels.
        </p>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>AVERAGE RATING</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FBBF24' }}>
                ★ {stats.average_rating}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>/ 5.0</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>TOTAL REVIEWS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38BDF8', marginTop: '6px' }}>
              {stats.total_reviews}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>5-STAR RATINGS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399', marginTop: '6px' }}>
              {stats.breakdown['5'] || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '12px 16px',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'ALL', label: 'All Reviews' },
            { key: '1', label: 'Approved' },
            { key: '0', label: 'Pending Moderation' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterApproved(f.key)}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: filterApproved === f.key ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                background: filterApproved === f.key ? '#2563EB' : 'rgba(255, 255, 255, 0.04)',
                color: filterApproved === f.key ? '#FFF' : '#CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search passenger, route..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#FFF',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Reviews Table / Cards */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#60A5FA', fontWeight: 600 }}>
          Loading customer reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
          }}
        >
          <MessageSquare size={40} color="#64748B" style={{ marginBottom: '12px' }} />
          <div style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '1.1rem' }}>No reviews found</div>
          <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
            No reviews match the selected filter criteria.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredReviews.map(r => (
            <div
              key={r.id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F8FAFC' }}>
                      {r.customer_name}
                    </span>
                    {r.customer_phone && (
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        ({r.customer_phone})
                      </span>
                    )}
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: r.is_approved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: r.is_approved ? '#34D399' : '#F87171',
                        border: `1px solid ${r.is_approved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      }}
                    >
                      {r.is_approved ? 'APPROVED & VISIBLE' : 'PENDING APPROVAL'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#FBBF24" color="#FBBF24" />
                      ))}
                    </div>
                    {r.route && <span>• {r.route}</span>}
                    {r.trip_ref && <span>• Ref: {r.trip_ref}</span>}
                    {r.created_at && <span>• {String(r.created_at).slice(0, 10)}</span>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleApprove(r.id, r.is_approved || 0)}
                    disabled={actionLoading === r.id}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: r.is_approved ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: r.is_approved ? '#F87171' : '#34D399',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {r.is_approved ? (
                      <>
                        <XCircle size={14} /> Unapprove / Hide
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Approve & Publish
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={actionLoading === r.id}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#EF4444',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="Delete Review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Review Text Body */}
              <div
                style={{
                  color: '#CBD5E1',
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                "{r.review_text}"
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
