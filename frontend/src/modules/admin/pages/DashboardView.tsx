import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Booking } from '../../../types';
import {
  Calendar,
  Users,
  Car,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Printer,
  Sparkles,
} from 'lucide-react';
import { RevenueChart } from '../components/Charts/RevenueChart';
import { StatusBreakdownChart } from '../components/Charts/StatusBreakdownChart';
import { VehicleUtilizationChart } from '../components/Charts/VehicleUtilizationChart';
import { PopularRoutesChart } from '../components/Charts/PopularRoutesChart';
import { PeakHoursChart } from '../components/Charts/PeakHoursChart';

export const DashboardView: React.FC<{ onNavigateToBookings?: () => void }> = ({
  onNavigateToBookings,
}) => {
  const [summary, setSummary] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [chartsData, setChartsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [sumRes, chartsRes] = await Promise.all([
        api.get<{
          success: boolean;
          summary: any;
          recent_bookings: Booking[];
        }>('/api/dashboard/summary'),
        api.get<any>('/api/dashboard/charts').catch(() => null),
      ]);

      if (sumRes.success) {
        setSummary(sumRes.summary);
        setRecentBookings(sumRes.recent_bookings || []);
      }
      if (chartsRes && chartsRes.success) {
        setChartsData(chartsRes);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    NEW: { bg: 'rgba(59, 130, 246, 0.15)', text: '#93C5FD' },
    CONTACTED: { bg: 'rgba(234, 179, 8, 0.15)', text: '#FDE047' },
    CONFIRMED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#6EE7B7' },
    COMPLETED: { bg: 'rgba(99, 102, 241, 0.15)', text: '#A5B4FC' },
    CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#FCA5A5' },
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Bar with Print/Export CTA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
            Executive Operations Dashboard
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '2px' }}>
            Live fleet telemetry, revenue trends & booking pipeline
          </div>
        </div>

        <button
          onClick={handlePrint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            color: '#CBD5E1',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Printer size={16} /> Print / Export Report
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Card 1: Total Bookings */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
              Total Bookings
            </span>
            <Calendar size={20} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC' }}>
            {summary?.total_bookings ?? summary?.today_enquiries ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Lifetime dispatch volume
          </div>
        </div>

        {/* Card 2: Pending Bookings */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
              Pending Action
            </span>
            <AlertCircle size={20} color="#EAB308" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FACC15' }}>
            {summary?.pending_bookings ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Awaiting confirmation
          </div>
        </div>

        {/* Card 3: Fleet Vehicles */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
              Fleet Vehicles
            </span>
            <Car size={20} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399' }}>
            {summary?.total_vehicles ?? summary?.active_vehicles ?? 4}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            {summary?.active_vehicles ?? 4} active on expressways
          </div>
        </div>

        {/* Card 4: Registered Drivers */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
              Fleet Drivers
            </span>
            <Users size={20} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22D3EE' }}>
            {summary?.total_drivers ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Verified commercial drivers
          </div>
        </div>

        {/* Card 5: Staff & Administrators */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
          }}
          onClick={() => {
            window.location.hash = '#/admin/users';
          }}
          title="Click to view User Management"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
              Staff & Admins
            </span>
            <Users size={20} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C084FC' }}>
            {summary?.total_users ?? 1}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#818CF8', marginTop: '4px' }}>
            Click to manage users →
          </div>
        </div>

        {/* Card 6: Monthly Revenue */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>
              Monthly Revenue
            </span>
            <TrendingUp size={20} color="#F43F5E" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FDA4AF' }}>
            ₹{summary?.monthly_revenue ? Number(summary.monthly_revenue).toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Across {summary?.completed_trips ?? 0} completed trips
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Revenue Trend & Status Lifecycle */}
      {chartsData && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          <RevenueChart
            dates={chartsData.dates || []}
            revenues={chartsData.daily_revenue || []}
            bookings={chartsData.daily_bookings || []}
          />
          <StatusBreakdownChart statusCounts={chartsData.status_breakdown || {}} />
        </div>
      )}

      {/* Row 2 Charts: Fleet Utilization, High Density Routes, Peak Rush Heatmap */}
      {chartsData && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          <VehicleUtilizationChart distribution={chartsData.vehicle_distribution || {}} />
          <PopularRoutesChart routes={chartsData.popular_routes || []} />
          <PeakHoursChart slots={chartsData.peak_hours || []} />
        </div>
      )}

      {/* Recent Bookings Table */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC' }}>
              Recent Bookings
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
              Latest customer enquiries from website
            </div>
          </div>
          {onNavigateToBookings && (
            <button
              onClick={onNavigateToBookings}
              style={{
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#93C5FD',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View All Bookings →
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
                <th style={{ padding: '12px 16px' }}>Ref #</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Route</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Vehicle</th>
                <th style={{ padding: '12px 16px' }}>Est. Fare</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}
                  >
                    No bookings recorded yet.
                  </td>
                </tr>
              ) : (
                recentBookings.map(b => {
                  const s = statusColors[b.status] || { bg: 'rgba(255,255,255,0.1)', text: '#fff' };
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#60A5FA' }}>
                        {b.booking_ref}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{b.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {b.customer_phone}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          {b.pickup_location} ➔ {b.drop_location}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div>{b.travel_date}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{b.travel_time}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{b.vehicle_name}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10B981' }}>
                        ₹{b.estimated_fare}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: s.bg,
                            color: s.text,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
