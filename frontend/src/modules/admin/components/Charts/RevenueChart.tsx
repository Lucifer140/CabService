import React from 'react';
import { IndianRupee, TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  dates: string[];
  revenues: number[];
  bookings: number[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ dates, revenues, bookings }) => {
  const maxRevenue = Math.max(...revenues, 10000);
  const totalRevenue = revenues.reduce((acc, curr) => acc + curr, 0);
  const totalBookings = bookings.reduce((acc, curr) => acc + curr, 0);

  // SVG Coordinates calculation
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = revenues.map((rev, idx) => {
    const x = paddingX + (idx / Math.max(1, revenues.length - 1)) * chartW;
    const y = height - paddingY - (rev / maxRevenue) * chartH;
    return { x, y, rev, date: dates[idx], count: bookings[idx] };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>
            <TrendingUp size={16} /> REVENUE TRAJECTORY (7 DAYS)
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 0' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </h3>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Across {totalBookings} completed & active trips this week
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8' }} />
            <span>Daily Revenue</span>
          </div>
        </div>
      </div>

      {/* SVG Responsive Line Graph */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '400px' }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * chartH;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="'Inter', sans-serif"
                >
                  ₹{Math.round((maxRevenue * ratio) / 1000)}k
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaD && <path d={areaD} fill="url(#revenueGradient)" />}

          {/* Line stroke */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and Value Tooltips */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth="2.5"
              />
              <text
                x={p.x}
                y={height - 8}
                fill="#94A3B8"
                fontSize="11"
                textAnchor="middle"
                fontWeight="600"
                fontFamily="'Inter', sans-serif"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
