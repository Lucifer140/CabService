import React from 'react';
import { Clock, Flame } from 'lucide-react';

interface PeakHourSlot {
  slot: string;
  label: string;
  count: number;
}

interface PeakHoursChartProps {
  slots: PeakHourSlot[];
}

export const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ slots }) => {
  const maxVolume = Math.max(...slots.map(s => s.count), 1);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
        <Flame size={16} /> TRAFFIC PEAK HOURS
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 20px' }}>
        Hourly Demand Heatmap
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        {slots.map((item, idx) => {
          const intensity = item.count / maxVolume;
          return (
            <div
              key={idx}
              style={{
                padding: '14px 12px',
                borderRadius: '14px',
                background: `rgba(245, 158, 11, ${Math.max(0.08, intensity * 0.35)})`,
                border: `1px solid rgba(245, 158, 11, ${Math.max(0.15, intensity * 0.5)})`,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '2px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 700, marginBottom: '6px' }}>
                {item.slot}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: intensity > 0.7 ? '#F59E0B' : '#F8FAFC' }}>
                {item.count} rides
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
