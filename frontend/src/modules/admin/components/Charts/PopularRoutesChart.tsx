import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface PopularRoutesChartProps {
  routes: Array<{ route: string; count: number }>;
}

export const PopularRoutesChart: React.FC<PopularRoutesChartProps> = ({ routes }) => {
  const maxCount = Math.max(...routes.map(r => r.count), 1);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
        <Navigation size={16} /> ROUTE DENSITY ANALYTICS
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 20px' }}>
        Top Highway Corridors
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {routes.map((item, idx) => {
          const ratio = Math.round((item.count / maxCount) * 100);
          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: '#E2E8F0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#60A5FA" /> {item.route}
                </span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>
                  {item.count} rides
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${ratio}%`,
                    background: 'linear-gradient(90deg, #2563EB, #10B981)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
