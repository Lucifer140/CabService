import React, { useState } from 'react';
import { Booking } from '../../../types';
import { Modal } from '../../shared/Modal';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Car,
  DollarSign,
  FileText,
  UserCheck,
  MessageCircle,
  Save,
  CheckCircle2,
  Printer,
  X,
} from 'lucide-react';
import { api } from '../../../services/api';

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!booking) return null;

  const [status, setStatus] = useState<string>(booking.status);
  const [driverName, setDriverName] = useState<string>(booking.assigned_driver || '');
  const [driverPhone, setDriverPhone] = useState<string>(booking.driver_phone || '');
  const [finalAmount, setFinalAmount] = useState<string>(
    booking.final_amount !== null && booking.final_amount !== undefined
      ? String(booking.final_amount)
      : String(booking.estimated_fare)
  );
  const [internalNotes, setInternalNotes] = useState<string>(booking.internal_notes || '');
  const [driverList, setDriverList] = useState<{ id: number; name: string; phone: string; vehicle_assigned?: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    api.get<{ success: boolean; drivers: any[] }>('/api/drivers')
      .then(res => {
        if (res.success && res.drivers) {
          setDriverList(res.drivers);
        }
      })
      .catch(console.error);
  }, []);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/bookings/${booking.id}`, {
        ...booking,
        status,
        assigned_driver: driverName.trim(),
        driver_phone: driverPhone.trim(),
        final_amount: parseFloat(finalAmount) || booking.estimated_fare,
        internal_notes: internalNotes.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onUpdate();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to update booking details');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintInvoice = () => {
    const token = localStorage.getItem('admin_token') || '';
    window.open(`/api/bookings/${booking.id}/invoice?token=${token}`, '_blank');
  };

  const cleanPhone = booking.customer_phone.replace(/\D/g, '');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Booking File: ${booking.booking_ref}`}>
      <div style={{ maxHeight: '78vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Quick Header Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>TRIP TYPE & REF</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60A5FA' }}>
              {booking.booking_ref}{' '}
              <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>
                ({booking.trip_type.toUpperCase()})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <a
              href={`tel:+91${cleanPhone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#93C5FD',
                textDecoration: 'none',
                fontSize: '0.825rem',
                fontWeight: 700,
              }}
            >
              <Phone size={14} /> Call
            </a>

            <a
              href={`https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(booking.customer_name)},%20regarding%20your%20Pune-Mumbai%20cab%20booking%20(Ref:%20${booking.booking_ref})`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                borderRadius: '8px',
                color: '#34D399',
                textDecoration: 'none',
                fontSize: '0.825rem',
                fontWeight: 700,
              }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>

            <button
              onClick={handlePrintInvoice}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Printer size={14} /> Invoice
            </button>
          </div>
        </div>

        {/* Customer & Route Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Passenger Information */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#94A3B8', fontWeight: 700 }}>
              PASSENGER DETAILS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Name:</span>{' '}
                <strong style={{ color: '#FFF' }}>{booking.customer_name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Phone:</span>{' '}
                <strong style={{ color: '#60A5FA' }}>{booking.customer_phone}</strong>
              </div>
              {booking.customer_email && (
                <div>
                  <span style={{ color: '#64748B' }}>Email:</span>{' '}
                  <span style={{ color: '#CBD5E1' }}>{booking.customer_email}</span>
                </div>
              )}
              <div>
                <span style={{ color: '#64748B' }}>Passengers:</span>{' '}
                <span style={{ color: '#CBD5E1' }}>{booking.passengers} Pax</span>
              </div>
              {booking.customer_notes && (
                <div style={{ marginTop: '4px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: '#FDE047', fontSize: '0.8rem' }}>
                  Note: "{booking.customer_notes}"
                </div>
              )}
            </div>
          </div>

          {/* Route & Schedule */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#94A3B8', fontWeight: 700 }}>
              ROUTE & SCHEDULE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#10B981', fontWeight: 700 }}>Pickup:</span>{' '}
                <span style={{ color: '#FFF' }}>{booking.pickup_location}</span>
              </div>
              <div>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>Drop:</span>{' '}
                <span style={{ color: '#FFF' }}>{booking.drop_location}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Date/Time:</span>{' '}
                <strong style={{ color: '#60A5FA' }}>
                  {booking.travel_date} ({booking.travel_time || 'Flexible'})
                </strong>
              </div>
              {booking.return_date && (
                <div>
                  <span style={{ color: '#64748B' }}>Return Date:</span>{' '}
                  <span style={{ color: '#CBD5E1' }}>{booking.return_date}</span>
                </div>
              )}
              <div>
                <span style={{ color: '#64748B' }}>Vehicle:</span>{' '}
                <strong style={{ color: '#FBBF24' }}>{booking.vehicle_name}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form: Status, Driver, Fares, Internal Notes */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                TRIP STATUS *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0B1120',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#FFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="NEW">NEW (Pending Enquiry)</option>
                <option value="CONTACTED">CONTACTED (Desk Review)</option>
                <option value="CONFIRMED">CONFIRMED (Booking Locked)</option>
                <option value="ASSIGNED">ASSIGNED (Chauffeur Allotted)</option>
                <option value="IN_TRANSIT">IN_TRANSIT (On Highway)</option>
                <option value="COMPLETED">COMPLETED (Safe Arrival)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                FINAL FARE AMOUNT (₹) *
              </label>
              <input
                type="number"
                value={finalAmount}
                onChange={e => setFinalAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0B1120',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#FFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {driverList.length > 0 && (
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#93C5FD', fontWeight: 600, marginBottom: '6px' }}>
                QUICK-SELECT ACTIVE FLEET CHAUFFEUR
              </label>
              <select
                onChange={e => {
                  const d = driverList.find(item => item.name === e.target.value);
                  if (d) {
                    setDriverName(d.name);
                    setDriverPhone(d.phone);
                    if (status === 'NEW' || status === 'CONTACTED') setStatus('CONFIRMED');
                  }
                }}
                defaultValue=""
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#0B1120',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  color: '#FFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="">-- Choose from Registered Fleet Chauffeurs --</option>
                {driverList.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.phone}) — {d.vehicle_assigned || 'Fleet Cab'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                ASSIGNED CHAUFFEUR NAME
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Shinde"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0B1120',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
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
                CHAUFFEUR MOBILE NUMBER
              </label>
              <input
                type="tel"
                placeholder="10-digit driver number"
                value={driverPhone}
                onChange={e => setDriverPhone(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0B1120',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#FFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
              INTERNAL DISPATCH & TIMELINE NOTES
            </label>
            <textarea
              rows={3}
              placeholder="Internal dispatcher notes, special customer requests, toll receipt numbers, flight code..."
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0B1120',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#FFF',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          {savedSuccess && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: '#34D399',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} /> Booking updated successfully!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#94A3B8',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
