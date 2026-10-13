import React from 'react';
import { PieChart, CheckCircle2, Clock, XCircle, ArrowUpRight } from 'lucide-react';

interface StatusBreakdownChartProps {
  statusCounts: Record<string, number>;
}

export const StatusBreakdownChart: React.FC<StatusBreakdownChartProps> = ({ statusCounts }) => {
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    CONFIRMED: { label: 'Confirmed', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)' },
    COMPLETED: { label: 'Completed', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
    NEW: { label: 'New / Inquiries', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.2)' },
    IN_TRANSIT: { label: 'In Transit', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.2)' },
    CANCELLED: { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' },
  };

  const statusList = Object.entries(statusCounts).map(([status, count]) => {
    const config = STATUS_CONFIG[status] || {
      label: status,
      color: '#64748B',
      bg: 'rgba(100, 116, 139, 0.2)',
    };
    const percentage = Math.round((count / total) * 100);
    return { status, count, percentage, ...config };
  });

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
        <PieChart size={16} /> BOOKING STATUS BREAKDOWN
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 16px' }}>
        Lifecycle Distribution
      </h3>

      {/* Multi-segment Progress Bar */}
      <div
        style={{
          display: 'flex',
          height: '14px',
          borderRadius: '7px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.05)',
          marginBottom: '20px',
          gap: '2px',
        }}
      >
        {statusList.map((item, idx) => (
          <div
            key={idx}
            style={{
              width: `${Math.max(item.percentage, 2)}%`,
              background: item.color,
              transition: 'width 0.4s ease',
            }}
            title={`${item.label}: ${item.count} (${item.percentage}%)`}
          />
        ))}
      </div>

      {/* List breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {statusList.map(item => (
          <div
            key={item.status}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.color,
                }}
              />
              <span style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                {item.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>
                {item.count}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', width: '36px', textAlign: 'right' }}>
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
