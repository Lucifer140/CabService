import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Booking } from '../../../types';
import { Modal } from '../../shared/Modal';
import { BookingDetailModal } from '../components/BookingDetailModal';
import {
  Search,
  Download,
  Trash2,
  Phone,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Eye,
  Printer,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  X,
} from 'lucide-react';

export const BookingsView: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [driverFilter, setDriverFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('CONFIRMED');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Modals
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverList, setDriverList] = useState<{ id: number; name: string; phone: string; vehicle_assigned?: string }[]>([]);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedStatus, search, vehicleFilter, driverFilter, startDate, endDate, page, perPage]);

  const loadDrivers = async () => {
    try {
      const res = await api.get<{ success: boolean; drivers: any[] }>('/api/drivers');
      if (res.success && res.drivers) {
        setDriverList(res.drivers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (search.trim()) params.set('search', search.trim());
      if (vehicleFilter !== 'ALL') params.set('vehicle', vehicleFilter);
      if (driverFilter !== 'ALL') params.set('driver', driverFilter);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      params.set('page', String(page));
      params.set('per_page', String(perPage));

      const res = await api.get<{
        success: boolean;
        bookings: Booking[];
        total?: number;
        pages?: number;
      }>(`/api/bookings?${params.toString()}`);

      if (res.success) {
        setBookings(res.bookings || []);
        if (res.total !== undefined) setTotalCount(res.total);
        if (res.pages !== undefined) setTotalPages(res.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: number, status: string) => {
    try {
      await api.post(`/api/bookings/${bookingId}/status`, { status });
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking || !driverName) return;

    try {
      await api.post(`/api/bookings/${activeBooking.id}/assign`, {
        driver_name: driverName,
        driver_phone: driverPhone,
        status: 'CONFIRMED',
      });
      setDriverModalOpen(false);
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Driver assignment failed');
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking record?')) return;
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      setSelectedIds(prev => prev.filter(id => id !== bookingId));
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedIds.length === bookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bookings.map(b => b.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApplyBulkStatus = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkProcessing(true);
      await api.post('/api/bookings/bulk-status', {
        ids: selectedIds,
        status: bulkStatus,
      });
      setSelectedIds([]);
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Bulk status update failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected bookings? This action cannot be undone.`
      )
    )
      return;
    try {
      setBulkProcessing(true);
      await api.post('/api/bookings/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Bulk delete failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('admin_token') || '';
    const params = new URLSearchParams();
    if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
    if (search.trim()) params.set('search', search.trim());
    if (vehicleFilter !== 'ALL') params.set('vehicle', vehicleFilter);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    params.set('token', token);
    window.open(`/api/bookings/export-csv?${params.toString()}`, '_blank');
  };

  const handlePrintInvoice = (bookingId: number) => {
    const token = localStorage.getItem('admin_token') || '';
    window.open(`/api/bookings/${bookingId}/invoice?token=${token}`, '_blank');
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    NEW: { bg: 'rgba(59, 130, 246, 0.15)', text: '#93C5FD' },
    CONTACTED: { bg: 'rgba(234, 179, 8, 0.15)', text: '#FDE047' },
    CONFIRMED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#6EE7B7' },
    ASSIGNED: { bg: 'rgba(16, 185, 129, 0.25)', text: '#A7F3D0' },
    IN_TRANSIT: { bg: 'rgba(14, 165, 233, 0.2)', text: '#7DD3FC' },
    COMPLETED: { bg: 'rgba(99, 102, 241, 0.15)', text: '#A5B4FC' },
    CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#FCA5A5' },
  };

  return (
    <div>
      {/* Filters and Search Header */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Status Pill Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>
            STATUS:
          </span>
          {['ALL', 'NEW', 'CONTACTED', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map(
            st => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setPage(1);
                }}
                style={{
                  padding: '6px 14px',
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
                  transition: 'all 0.15s ease',
                }}
              >
                {st}
              </button>
            )
          )}
        </div>

        {/* Multi-Filter Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search reference, customer, mobile, city..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Vehicle Dropdown */}
          <select
            value={vehicleFilter}
            onChange={e => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#CBD5E1',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Vehicles</option>
            <option value="dzire">Swift Dzire (Sedan)</option>
            <option value="ertiga">Maruti Ertiga (MPV)</option>
            <option value="innova">Innova Crysta (SUV)</option>
            <option value="tempo">Tempo Traveller (Minibus)</option>
          </select>

          {/* Chauffeur Filter */}
          <select
            value={driverFilter}
            onChange={e => {
              setDriverFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 12px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#CBD5E1',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Chauffeurs</option>
            <option value="UNASSIGNED">Unassigned Only</option>
            {driverList.map(d => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              title="From travel date"
              style={{
                padding: '8px 10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            <span style={{ color: '#64748B', fontSize: '0.8rem' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              title="To travel date"
              style={{
                padding: '8px 10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Clear date filter"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            style={{
              padding: '9px 16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar when items selected */}
      {selectedIds.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, #1E3A8A 0%, #1E293B 100%)',
            border: '1px solid #3B82F6',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#2563EB',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              {selectedIds.length}
            </span>
            <span style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.9rem' }}>
              Booking(s) Selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: '#93C5FD', fontSize: '0.85rem' }}>Change status to:</span>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              style={{
                padding: '7px 12px',
                background: '#0B1120',
                border: '1px solid #3B82F6',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button
              onClick={handleApplyBulkStatus}
              disabled={bulkProcessing}
              style={{
                padding: '7px 16px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {bulkProcessing ? 'Updating...' : 'Update Status'}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              style={{
                padding: '7px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                borderRadius: '6px',
                color: '#FCA5A5',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '20px',
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
                <th style={{ padding: '14px 16px', width: '40px', textAlign: 'center' }}>
                  <button
                    onClick={handleSelectAll}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    {selectedIds.length > 0 && selectedIds.length === bookings.length ? (
                      <CheckSquare size={16} color="#3B82F6" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th style={{ padding: '14px 16px' }}>Ref / Date</th>
                <th style={{ padding: '14px 16px' }}>Customer Info</th>
                <th style={{ padding: '14px 16px' }}>Pickup ➔ Drop</th>
                <th style={{ padding: '14px 16px' }}>Cab & Fare</th>
                <th style={{ padding: '14px 16px' }}>Assigned Driver</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ padding: '50px 20px', textAlign: 'center', color: '#64748B' }}
                  >
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Loading bookings...</span>
                      </div>
                    ) : (
                      'No bookings match the selected criteria.'
                    )}
                  </td>
                </tr>
              ) : (
                bookings.map(b => {
                  const s = statusColors[b.status] || { bg: 'rgba(255,255,255,0.1)', text: '#fff' };
                  const isChecked = selectedIds.includes(b.id);
                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: isChecked ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleSelect(b.id)}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                        >
                          {isChecked ? <CheckSquare size={16} color="#3B82F6" /> : <Square size={16} />}
                        </button>
                      </td>

                      {/* Ref & Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setDetailBooking(b)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontWeight: 800,
                            color: '#60A5FA',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            textAlign: 'left',
                          }}
                        >
                          {b.booking_ref}
                        </button>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                          {b.travel_date}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{b.travel_time}</div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{b.customer_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#93C5FD' }}>
                          {b.customer_phone}
                        </div>
                        {b.customer_email && (
                          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            {b.customer_email}
                          </div>
                        )}
                      </td>

                      {/* Route & Trip */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{b.pickup_location}</div>
                        <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                          ➔ {b.drop_location}
                        </div>
                        <div
                          style={{
                            color: '#64748B',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            marginTop: '2px',
                          }}
                        >
                          {b.trip_type}
                        </div>
                      </td>

                      {/* Cab & Fare */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{b.vehicle_name}</div>
                        <div style={{ color: '#10B981', fontWeight: 700, fontSize: '0.95rem' }}>
                          ₹{b.final_amount !== null && b.final_amount !== undefined ? b.final_amount : b.estimated_fare}
                        </div>
                      </td>

                      {/* Assigned Driver */}
                      <td style={{ padding: '14px 16px' }}>
                        {b.assigned_driver && b.assigned_driver !== 'Unassigned' ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#34D399' }}>
                              {b.assigned_driver}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                              {b.driver_phone}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveBooking(b);
                              setDriverName('');
                              setDriverPhone('');
                              setDriverModalOpen(true);
                            }}
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#93C5FD',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            + Assign Driver
                          </button>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={b.status}
                          onChange={e => handleStatusChange(b.id, e.target.value)}
                          style={{
                            background: s.bg,
                            color: s.text,
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="NEW" style={{ background: '#1E293B', color: '#fff' }}>
                            NEW
                          </option>
                          <option
                            value="CONTACTED"
                            style={{ background: '#1E293B', color: '#fff' }}
                          >
                            CONTACTED
                          </option>
                          <option
                            value="CONFIRMED"
                            style={{ background: '#1E293B', color: '#fff' }}
                          >
                            CONFIRMED
                          </option>
                          <option
                            value="ASSIGNED"
                            style={{ background: '#1E293B', color: '#fff' }}
                          >
                            ASSIGNED
                          </option>
                          <option
                            value="IN_TRANSIT"
                            style={{ background: '#1E293B', color: '#fff' }}
                          >
                            IN_TRANSIT
                          </option>
                          <option
                            value="COMPLETED"
                            style={{ background: '#1E293B', color: '#fff' }}
                          >
                            COMPLETED
                          </option>
                          <option
                            value="CANCELLED"
                            style={{ background: '#1E293B', color: '#fff' }}
                          >
                            CANCELLED
                          </option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setDetailBooking(b)}
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              color: '#93C5FD',
                              cursor: 'pointer',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                            }}
                            title="View Full Booking Dossier"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => handlePrintInvoice(b.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#CBD5E1',
                              cursor: 'pointer',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                            }}
                            title="Print GST Invoice"
                          >
                            <Printer size={13} />
                          </button>

                          <button
                            onClick={() => handleDelete(b.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Delete Booking"
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

      {/* Pagination Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          color: '#94A3B8',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            Showing {bookings.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
            {Math.min(page * perPage, totalCount)} of {totalCount} bookings
          </span>
          <select
            value={perPage}
            onChange={e => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            style={{
              padding: '4px 8px',
              background: '#131B2E',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#CBD5E1',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '6px 12px',
              background: '#131B2E',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: page <= 1 ? '#475569' : '#CBD5E1',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span style={{ padding: '0 8px', color: '#fff', fontWeight: 600 }}>
            Page {page} of {totalPages || 1}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '6px 12px',
              background: '#131B2E',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: page >= totalPages ? '#475569' : '#CBD5E1',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Booking Detail Modal / Dossier */}
      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          isOpen={!!detailBooking}
          onClose={() => setDetailBooking(null)}
          onUpdate={loadBookings}
        />
      )}

      {/* Quick Assign Driver Modal */}
      <Modal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        title={`Assign Chauffeur for ${activeBooking?.booking_ref}`}
      >
        <form onSubmit={handleAssignDriver}>
          {driverList.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: '#93C5FD',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Select from Registered Fleet Chauffeurs
              </label>
              <select
                onChange={e => {
                  const d = driverList.find(item => item.name === e.target.value);
                  if (d) {
                    setDriverName(d.name);
                    setDriverPhone(d.phone);
                  }
                }}
                defaultValue=""
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              >
                <option value="">-- Choose Registered Chauffeur --</option>
                {driverList.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.phone}) — {d.vehicle_assigned}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#94A3B8',
                marginBottom: '6px',
              }}
            >
              Chauffeur Name
            </label>
            <input
              type="text"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              placeholder="e.g. Ramesh Shinde"
              required
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
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#94A3B8',
                marginBottom: '6px',
              }}
            >
              Chauffeur Mobile Number
            </label>
            <input
              type="tel"
              value={driverPhone}
              onChange={e => setDriverPhone(e.target.value)}
              placeholder="10-digit mobile"
              required
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setDriverModalOpen(false)}
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
              Assign & Notify via WhatsApp
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
