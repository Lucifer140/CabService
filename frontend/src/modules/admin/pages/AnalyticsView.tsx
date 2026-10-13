import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Toast } from '../../shared/Toast';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  MapPin,
  MessageSquare,
  Eye,
  RefreshCw,
  Percent,
  Activity,
  ArrowUpRight,
  PhoneCall,
} from 'lucide-react';

interface AnalyticsData {
  traffic: {
    page_views: number;
    widget_interactions: number;
    whatsapp_clicks: number;
    phone_clicks: number;
    conversion_rate: number;
    totals: Record<string, number>;
  };
  revenue: {
    total_bookings: number;
    total_estimated_fares: number;
    confirmed_revenue: number;
    average_fare: number;
  };
  fares_by_vehicle: Array<{
    vehicle_name: string;
    vehicle_key: string;
    booking_count: number;
    total_fare: number;
    avg_fare: number;
  }>;
  popular_routes: Array<{
    pickup_location: string;
    drop_location: string;
    trip_count: number;
    total_fare: number;
    avg_fare: number;
  }>;
  vehicle_utilization: Array<{
    vehicle_key: string;
    name: string;
    category: string;
    booking_count: number;
    total_revenue: number;
    share_percent: number;
  }>;
  trends: {
    daily: { labels: string[]; bookings: number[]; revenue: number[] };
    weekly: { labels: string[]; bookings: number[]; revenue: number[] };
    monthly: { labels: string[]; bookings: number[]; revenue: number[] };
  };
  recent_events: Array<{
    id: number;
    event_type: string;
    metadata_json: string;
    ip_address: string;
    created_at: string;
  }>;
}

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [trendMetric, setTrendMetric] = useState<'bookings' | 'revenue'>('bookings');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean } & AnalyticsData>('/api/analytics');
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get<{ success: boolean } & AnalyticsData>('/api/analytics')
      .then(res => {
        if (active && res.success) {
          setData(res);
        }
      })
      .catch((err: any) => {
        if (active) {
          showToast(err.message || 'Failed to load analytics', 'error');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Active trend series calculation
  const activeTrend = data?.trends ? data.trends[trendRange] : null;
  const trendLabels = activeTrend?.labels || [];
  const trendValues = activeTrend
    ? trendMetric === 'bookings'
      ? activeTrend.bookings
      : activeTrend.revenue
    : [];

  // SVG Chart Geometry Constants
  const svgWidth = 800;
  const svgHeight = 260;
  const padLeft = 55;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 40;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(...trendValues, trendMetric === 'bookings' ? 5 : 5000);
  const pointSpacing = trendLabels.length > 1 ? chartW / (trendLabels.length - 1) : chartW;

  const chartPoints = trendValues.map((val, idx) => {
    const x = padLeft + idx * pointSpacing;
    const y = padTop + chartH - (val / maxVal) * chartH;
    return { x, y, val, label: trendLabels[idx] || '' };
  });

  const linePathD = chartPoints.length
    ? chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '')
    : '';

  const areaPathD = chartPoints.length
    ? `${linePathD} L ${chartPoints[chartPoints.length - 1].x},${padTop + chartH} L ${chartPoints[0].x},${padTop + chartH} Z`
    : '';

  return (
    <div>
      {/* Toast Feedback */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner & Live Status */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
            }}
          >
            <BarChart3 size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              Business Analytics & Intelligence
            </h2>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
              Real-time booking velocity, revenue attribution, conversion funnel & fleet utilization
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={loadAnalytics}
            title="Refresh Analytics"
            style={{
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#CBD5E1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw
              size={16}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* TOP KPI SUMMARY STATS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {/* Total Estimated Revenue */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
            <span
              style={{
                fontSize: '0.8rem',
                color: '#94A3B8',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Total Booking Value
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC' }}>
              ₹{(data?.revenue.total_estimated_fares || 0).toLocaleString('en-IN')}
            </div>
            <div
              style={{
                color: '#10B981',
                fontSize: '0.78rem',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowUpRight size={13} />
              <span>
                Confirmed: ₹{(data?.revenue.confirmed_revenue || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Total Bookings & Average Fare */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
            <span
              style={{
                fontSize: '0.8rem',
                color: '#94A3B8',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Total Trips Dispatched
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Car size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC' }}>
              {data?.revenue.total_bookings || 0}
            </div>
            <div style={{ color: '#60A5FA', fontSize: '0.78rem', marginTop: '6px' }}>
              Avg Trip Ticket:{' '}
              <strong>
                ₹{Math.round(data?.revenue.average_fare || 0).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>

        {/* Website Traffic & Pageviews */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
            <span
              style={{
                fontSize: '0.8rem',
                color: '#94A3B8',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Website Visitors
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC' }}>
              {data?.traffic.page_views || 0}
            </div>
            <div style={{ color: '#F59E0B', fontSize: '0.78rem', marginTop: '6px' }}>
              Widget Submits: <strong>{data?.traffic.widget_interactions || 0}</strong>
            </div>
          </div>
        </div>

        {/* Conversion Rate & WhatsApp Inquiries */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
            <span
              style={{
                fontSize: '0.8rem',
                color: '#94A3B8',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Conversion Rate
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#C084FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Percent size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC' }}>
              {data?.traffic.conversion_rate || 0}%
            </div>
            <div
              style={{
                color: '#34D399',
                fontSize: '0.78rem',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <MessageSquare size={13} />
              <span>WhatsApp Clicks: {data?.traffic.whatsapp_clicks || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE BOOKING TRENDS CHART */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Chart Header & Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC' }}>
              Booking & Revenue Velocity Trends
            </h3>
            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
              Interactive timeline view with telemetry data points
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Metric Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '3px',
                borderRadius: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setTrendMetric('bookings')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background:
                    trendMetric === 'bookings' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  color: trendMetric === 'bookings' ? '#93C5FD' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Bookings Count
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('revenue')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: trendMetric === 'revenue' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                  color: trendMetric === 'revenue' ? '#34D399' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Revenue (₹)
              </button>
            </div>

            {/* Timeframe Range Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '3px',
                borderRadius: '8px',
              }}
            >
              {(['daily', 'weekly', 'monthly'] as const).map(range => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTrendRange(range)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: trendRange === range ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: trendRange === range ? '#F8FAFC' : '#64748B',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Chart Rendering */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', minWidth: '600px', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={trendMetric === 'bookings' ? '#3B82F6' : '#10B981'}
                  stopOpacity="0.4"
                />
                <stop
                  offset="100%"
                  stopColor={trendMetric === 'bookings' ? '#3B82F6' : '#10B981'}
                  stopOpacity="0.0"
                />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = padTop + chartH - pct * chartH;
              const val = Math.round(pct * maxVal);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + chartW}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeDasharray={pct === 0 ? 'none' : '4 4'}
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    fill="#64748B"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {trendMetric === 'revenue' ? `₹${(val / 1000).toFixed(0)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area Fill */}
            {areaPathD && <path d={areaPathD} fill="url(#trendGradient)" />}

            {/* Main Trend Line */}
            {linePathD && (
              <path
                d={linePathD}
                fill="none"
                stroke={trendMetric === 'bookings' ? '#3B82F6' : '#10B981'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points and X Labels */}
            {chartPoints.map((pt, i) => {
              const isHovered = hoveredPointIndex === i;
              return (
                <g key={i}>
                  {/* Vertical Guide when hovered */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={padTop + chartH}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Circle dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="#131B2E"
                    stroke={trendMetric === 'bookings' ? '#60A5FA' : '#34D399'}
                    strokeWidth={isHovered ? 3 : 2}
                    style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={() => setHoveredPointIndex(i)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />

                  {/* X Axis Label */}
                  <text
                    x={pt.x}
                    y={padTop + chartH + 20}
                    fill={isHovered ? '#FFFFFF' : '#64748B'}
                    fontSize="11"
                    textAnchor="middle"
                    fontWeight={isHovered ? 700 : 500}
                  >
                    {pt.label}
                  </text>

                  {/* Floating tooltip on hover */}
                  {isHovered && (
                    <g>
                      <rect
                        x={pt.x - 45}
                        y={pt.y - 38}
                        width="90"
                        height="26"
                        rx="6"
                        fill="#0F172A"
                        stroke="rgba(255, 255, 255, 0.2)"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 21}
                        fill="#F8FAFC"
                        fontSize="11"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {trendMetric === 'revenue'
                          ? `₹${pt.val.toLocaleString('en-IN')}`
                          : `${pt.val} trips`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* LOWER SECTION: REVENUE BY VEHICLE + POPULAR ROUTES + VEHICLE UTILIZATION */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Popular Routes Breakdown */}
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
              marginBottom: '18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#60A5FA" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Top Pickup & Drop Routes
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Ranked by Demand</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.popular_routes && data.popular_routes.length > 0 ? (
              data.popular_routes.slice(0, 6).map((route, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#F8FAFC',
                      }}
                    >
                      <span>{route.pickup_location}</span>
                      <span style={{ color: '#60A5FA' }}>➔</span>
                      <span>{route.drop_location}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                      Avg ticket: <strong>₹{Math.round(route.avg_fare)}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#93C5FD',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {route.trip_count} {route.trip_count === 1 ? 'trip' : 'trips'}
                    </span>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#10B981',
                        marginTop: '4px',
                      }}
                    >
                      ₹{route.total_fare.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                No route telemetry recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Utilization & Fleet Share */}
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
              marginBottom: '18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={18} color="#60A5FA" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Vehicle Fleet Utilization
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Dispatch Share %</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {data?.vehicle_utilization && data.vehicle_utilization.length > 0 ? (
              data.vehicle_utilization.map(veh => (
                <div key={veh.vehicle_key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F8FAFC' }}>
                        {veh.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '6px' }}>
                        ({veh.category})
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
                        ₹{veh.total_revenue.toLocaleString('en-IN')}
                      </span>
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#CBD5E1',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      >
                        {veh.share_percent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '7px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(4, veh.share_percent))}%`,
                        background:
                          veh.vehicle_key === 'dzire'
                            ? 'linear-gradient(90deg, #3B82F6, #60A5FA)'
                            : veh.vehicle_key === 'ertiga'
                              ? 'linear-gradient(90deg, #10B981, #34D399)'
                              : veh.vehicle_key === 'innova'
                                ? 'linear-gradient(90deg, #8B5CF6, #A78BFA)'
                                : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                No vehicle telemetry logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REVENUE BY VEHICLE TYPE & RECENT TELEMETRY LOGS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Fare by Vehicle Type Card */}
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
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#10B981" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Revenue by Vehicle Model
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Ticket Value</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.fares_by_vehicle && data.fares_by_vehicle.length > 0 ? (
              data.fares_by_vehicle.map((fv, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.875rem' }}>
                      {fv.vehicle_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      {fv.booking_count} bookings • Avg: ₹{Math.round(fv.avg_fare)}
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981' }}>
                    ₹{fv.total_fare.toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
                No vehicle revenue records.
              </div>
            )}
          </div>
        </div>

        {/* Traffic Funnel & Inquiry Channels */}
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
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#C084FC" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Customer Acquisition Funnel
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Conversion Metrics</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={16} color="#60A5FA" />
                <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                  Page Views
                </span>
              </div>
              <strong style={{ color: '#F8FAFC' }}>{data?.traffic.page_views || 0}</strong>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Car size={16} color="#F59E0B" />
                <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                  Booking Widget Interactions
                </span>
              </div>
              <strong style={{ color: '#F8FAFC' }}>{data?.traffic.widget_interactions || 0}</strong>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={16} color="#10B981" />
                <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                  WhatsApp Inquiries Triggered
                </span>
              </div>
              <strong style={{ color: '#34D399' }}>{data?.traffic.whatsapp_clicks || 0}</strong>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PhoneCall size={16} color="#C084FC" />
                <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                  Phone Call Inquiries
                </span>
              </div>
              <strong style={{ color: '#C084FC' }}>{data?.traffic.phone_clicks || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
