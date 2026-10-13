import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Driver, DriverStats } from '../../../types';
import { Modal } from '../../shared/Modal';
import {
  Users,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Star,
  Phone,
  Mail,
  Car,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const DriversView: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [vehicleAssigned, setVehicleAssigned] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'ON_TRIP' | 'OFFLINE'>('AVAILABLE');
  const [rating, setRating] = useState(4.9);
  const [totalTrips, setTotalTrips] = useState(0);
  const [photo, setPhoto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, [selectedStatus, search]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (search.trim()) params.set('search', search.trim());

      const res = await api.get<{
        success: boolean;
        drivers: Driver[];
        stats?: DriverStats;
      }>(`/api/drivers?${params.toString()}`);

      if (res.success) {
        setDrivers(res.drivers || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (d?: Driver) => {
    if (d) {
      setEditingDriver(d);
      setName(d.name);
      setPhone(d.phone);
      setEmail(d.email || '');
      setLicenseNo(d.license_no);
      setVehicleAssigned(d.vehicle_assigned || '');
      setStatus(d.status);
      setRating(d.rating);
      setTotalTrips(d.total_trips);
      setPhoto(d.photo || '');
    } else {
      setEditingDriver(null);
      setName('');
      setPhone('');
      setEmail('');
      setLicenseNo('');
      setVehicleAssigned('Maruti Dzire (MH12-RN-4821)');
      setStatus('AVAILABLE');
      setRating(4.9);
      setTotalTrips(0);
      setPhoto('');
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        phone,
        email,
        license_no: licenseNo,
        vehicle_assigned: vehicleAssigned,
        status,
        rating: Number(rating),
        total_trips: Number(totalTrips),
        photo,
      };

      if (editingDriver) {
        await api.put(`/api/drivers/${editingDriver.id}`, payload);
      } else {
        await api.post('/api/drivers', payload);
      }

      setModalOpen(false);
      loadDrivers();
    } catch (err: any) {
      alert(err.message || 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusQuickChange = async (driverId: number, newStatus: string) => {
    try {
      await api.post(`/api/drivers/${driverId}/status`, { status: newStatus });
      loadDrivers();
    } catch (err: any) {
      alert(err.message || 'Status change failed');
    }
  };

  const handleDelete = async (driverId: number, driverName: string) => {
    if (!window.confirm(`Are you sure you want to remove chauffeur ${driverName}?`)) return;
    try {
      await api.delete(`/api/drivers/${driverId}`);
      loadDrivers();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
    AVAILABLE: { bg: 'rgba(16, 185, 129, 0.15)', text: '#6EE7B7', dot: '#10B981' },
    ON_TRIP: { bg: 'rgba(59, 130, 246, 0.15)', text: '#93C5FD', dot: '#3B82F6' },
    OFFLINE: { bg: 'rgba(148, 163, 184, 0.15)', text: '#CBD5E1', dot: '#94A3B8' },
  };

  return (
    <div>
      {/* Metrics Row */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              TOTAL CHAUFFEURS
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {stats.total_drivers}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              Verified fleet drivers
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
              AVAILABLE NOW
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
              {stats.available_drivers}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              Ready for immediate dispatch
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
              ON EXPRESSWAY / TRIP
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6', marginTop: '4px' }}>
              {stats.on_trip_drivers}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              Active live journeys
            </div>
          </div>

          <div
            style={{
              background: '#131B2E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ color: '#FBBF24', fontSize: '0.8rem', fontWeight: 600 }}>
              AVERAGE FLEET RATING
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
              ★ {stats.average_rating}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              Across {stats.total_trips_completed} trips
            </div>
          </div>
        </div>
      )}

      {/* Top Filter & Add Bar */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'AVAILABLE', 'ON_TRIP', 'OFFLINE'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border:
                  selectedStatus === st
                    ? '1px solid #3B82F6'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                background:
                  selectedStatus === st
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.04)',
                color: selectedStatus === st ? '#93C5FD' : '#94A3B8',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Add */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search driver, mobile, vehicle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '8px 12px 8px 34px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                minWidth: '220px',
              }}
            />
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
            <span>Register Chauffeur</span>
          </button>
        </div>
      </div>

      {/* Drivers Table */}
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
                <th style={{ padding: '14px 16px' }}>Chauffeur</th>
                <th style={{ padding: '14px 16px' }}>Contact</th>
                <th style={{ padding: '14px 16px' }}>License & Vehicle</th>
                <th style={{ padding: '14px 16px' }}>Rating & Trips</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    {loading ? 'Loading chauffeur roster...' : 'No chauffeurs found.'}
                  </td>
                </tr>
              ) : (
                drivers.map(d => {
                  const s = statusStyles[d.status] || statusStyles.AVAILABLE;
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {/* Avatar & Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              background: '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              flexShrink: 0,
                            }}
                          >
                            {d.photo ? (
                              <img
                                src={d.photo}
                                alt={d.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ color: '#93C5FD', fontWeight: 700, fontSize: '0.9rem' }}>
                                {d.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                              {d.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              ID #{d.id} • Pune Hub
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93C5FD', fontWeight: 600 }}>
                          <Phone size={13} />
                          <span>{d.phone}</span>
                        </div>
                        {d.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '0.75rem', marginTop: '2px' }}>
                            <Mail size={12} />
                            <span>{d.email}</span>
                          </div>
                        )}
                      </td>

                      {/* License & Vehicle */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{d.license_no}</div>
                        <div style={{ color: '#FBBF24', fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Car size={13} />
                          <span>{d.vehicle_assigned || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Rating & Trips */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 700 }}>
                          <Star size={14} fill="#F59E0B" />
                          <span>{d.rating}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                          {d.total_trips} trips completed
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={d.status}
                          onChange={e => handleStatusQuickChange(d.id, e.target.value)}
                          style={{
                            background: s.bg,
                            color: s.text,
                            border: `1px solid ${s.dot}33`,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="AVAILABLE" style={{ background: '#1E293B', color: '#6EE7B7' }}>
                            AVAILABLE
                          </option>
                          <option value="ON_TRIP" style={{ background: '#1E293B', color: '#93C5FD' }}>
                            ON_TRIP
                          </option>
                          <option value="OFFLINE" style={{ background: '#1E293B', color: '#CBD5E1' }}>
                            OFFLINE
                          </option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenModal(d)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#60A5FA',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Edit Chauffeur"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Delete Chauffeur"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDriver ? `Edit Chauffeur: ${editingDriver.name}` : 'Register New Fleet Chauffeur'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Shinde"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                Mobile Number (10 digits) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 9822451020"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                Commercial Driving License *
              </label>
              <input
                type="text"
                required
                value={licenseNo}
                onChange={e => setLicenseNo(e.target.value)}
                placeholder="e.g. MH12-2015-0084721"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                Assigned Vehicle
              </label>
              <input
                type="text"
                value={vehicleAssigned}
                onChange={e => setVehicleAssigned(e.target.value)}
                placeholder="e.g. Maruti Dzire (MH12-RN-4821)"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ON_TRIP">ON_TRIP</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                Rating (1 - 5)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={rating}
                onChange={e => setRating(Number(e.target.value))}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
                Trips Completed
              </label>
              <input
                type="number"
                min="0"
                value={totalTrips}
                onChange={e => setTotalTrips(Number(e.target.value))}
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

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. driver@sangitatravels.in"
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>
              Photo URL (Optional)
            </label>
            <input
              type="url"
              value={photo}
              onChange={e => setPhoto(e.target.value)}
              placeholder="https://..."
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
              {saving ? 'Saving...' : editingDriver ? 'Update Chauffeur' : 'Save Chauffeur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
