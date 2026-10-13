import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Coupon } from '../../../types';
import { Modal } from '../../shared/Modal';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const CouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'flat'>('percentage');
  const [value, setValue] = useState(10);
  const [minFare, setMinFare] = useState(1500);
  const [maxDiscount, setMaxDiscount] = useState(300);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [usageLimit, setUsageLimit] = useState(100);
  const [isActive, setIsActive] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; coupons: Coupon[] }>('/api/coupons');
      if (res.success) {
        setCoupons(res.coupons || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (c?: Coupon) => {
    if (c) {
      setEditingCoupon(c);
      setCode(c.code);
      setType(c.type);
      setValue(c.value);
      setMinFare(c.min_fare);
      setMaxDiscount(c.max_discount);
      setValidFrom(c.valid_from || '');
      setValidTo(c.valid_to || '');
      setUsageLimit(c.usage_limit);
      setIsActive(c.is_active);
    } else {
      setEditingCoupon(null);
      setCode('');
      setType('percentage');
      setValue(10);
      setMinFare(1500);
      setMaxDiscount(300);
      setValidFrom('');
      setValidTo('');
      setUsageLimit(100);
      setIsActive(1);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_fare: Number(minFare),
        max_discount: Number(maxDiscount),
        valid_from: validFrom || null,
        valid_to: validTo || null,
        usage_limit: Number(usageLimit),
        is_active: isActive,
      };

      if (editingCoupon) {
        await api.put(`/api/coupons/${editingCoupon.id}`, payload);
      } else {
        await api.post('/api/coupons', payload);
      }

      setModalOpen(false);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await api.put(`/api/coupons/${coupon.id}`, {
        ...coupon,
        is_active: coupon.is_active ? 0 : 1,
      });
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Toggle failed');
    }
  };

  const handleDelete = async (couponId: number, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code ${couponCode}?`)) return;
    try {
      await api.delete(`/api/coupons/${couponId}`);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  // Metrics
  const activeCount = coupons.filter(c => c.is_active).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);

  return (
    <div>
      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '18px 20px',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>
            TOTAL PROMO CAMPAIGNS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            {coupons.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Registered discount vouchers
          </div>
        </div>

        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: '18px 20px',
          }}
        >
          <div style={{ color: '#6EE7B7', fontSize: '0.8rem', fontWeight: 600 }}>
            ACTIVE LIVE COUPONS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Eligible for booking checkout
          </div>
        </div>

        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '18px 20px',
          }}
        >
          <div style={{ color: '#93C5FD', fontSize: '0.8rem', fontWeight: 600 }}>
            TOTAL REDEMPTIONS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6', marginTop: '4px' }}>
            {totalUses}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            Trips booked with discounts
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Promotional Coupons & Voucher Rules
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94A3B8', fontSize: '0.8rem' }}>
            Configure percentage or flat deductions with minimum fare limits and usage quotas.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            padding: '9px 18px',
            background: '#2563EB',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94A3B8',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <th style={{ padding: '14px 16px' }}>Coupon Code</th>
                <th style={{ padding: '14px 16px' }}>Discount Type & Value</th>
                <th style={{ padding: '14px 16px' }}>Min Fare / Cap</th>
                <th style={{ padding: '14px 16px' }}>Usage / Quota</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    {loading ? 'Loading promo coupons...' : 'No coupons registered yet.'}
                  </td>
                </tr>
              ) : (
                coupons.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    {/* Code */}
                    <td style={{ padding: '14px 16px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px dashed #3B82F6',
                          color: '#93C5FD',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <Tag size={13} />
                        <span>{c.code}</span>
                      </div>
                    </td>

                    {/* Type & Value */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>
                        {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {c.type === 'percentage'
                          ? `Up to ₹${c.max_discount || 'Unlimited'} max discount`
                          : 'Flat deduction on total estimate'}
                      </div>
                    </td>

                    {/* Min Fare / Cap */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#CBD5E1' }}>
                        Min Fare: <strong style={{ color: '#FBBF24' }}>₹{c.min_fare}</strong>
                      </div>
                      {c.valid_to && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          Expires: {c.valid_to}
                        </div>
                      )}
                    </td>

                    {/* Usage */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#10B981' }}>
                        {c.used_count} <span style={{ color: '#64748B', fontWeight: 400 }}>/ {c.usage_limit} uses</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleActive(c)}
                        style={{
                          background: c.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: `1px solid ${c.is_active ? '#10B981' : '#EF4444'}44`,
                          color: c.is_active ? '#6EE7B7' : '#FCA5A5',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {c.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{c.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenModal(c)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#60A5FA',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Edit Coupon"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete Coupon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
              PROMO CODE (UPPERCASE) *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MONSOON200 or SANGITA10"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'monospace',
                fontWeight: 700,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                DISCOUNT TYPE *
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              >
                <option value="percentage">Percentage (%) Discount</option>
                <option value="flat">Flat Cash (₹) Discount</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                DISCOUNT VALUE *
              </label>
              <input
                type="number"
                step="any"
                required
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                placeholder={type === 'percentage' ? '10 (% off)' : '100 (₹ off)'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                MINIMUM FARE (₹)
              </label>
              <input
                type="number"
                value={minFare}
                onChange={e => setMinFare(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                MAX DISCOUNT CAP (₹)
              </label>
              <input
                type="number"
                value={maxDiscount}
                onChange={e => setMaxDiscount(Number(e.target.value))}
                placeholder="e.g. 300"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                USAGE LIMIT (MAX QUOTA)
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={e => setUsageLimit(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                EXPIRES ON (OPTIONAL)
              </label>
              <input
                type="date"
                value={validTo}
                onChange={e => setValidTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="couponActive"
              checked={isActive === 1}
              onChange={e => setIsActive(e.target.checked ? 1 : 0)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="couponActive" style={{ color: '#CBD5E1', fontSize: '0.85rem', cursor: 'pointer' }}>
              Activate coupon immediately for public bookings
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 20px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
