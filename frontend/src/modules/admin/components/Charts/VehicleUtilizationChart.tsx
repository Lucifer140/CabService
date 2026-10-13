import React from 'react';
import { Car, BarChart3 } from 'lucide-react';

interface VehicleUtilizationChartProps {
  distribution: Record<string, number>;
}

export const VehicleUtilizationChart: React.FC<VehicleUtilizationChartProps> = ({ distribution }) => {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;

  const VEHICLE_COLORS: Record<string, string> = {
    'Swift Dzire (Sedan)': '#38BDF8',
    'Maruti Ertiga (New MPV)': '#818CF8',
    'Innova Crysta (Luxury SUV)': '#34D399',
    'Tempo Traveller (13/17)': '#FBBF24',
  };

  const list = Object.entries(distribution).map(([veh, count]) => {
    const color = VEHICLE_COLORS[veh] || '#60A5FA';
    const percent = Math.round((count / total) * 100);
    return { veh, count, percent, color };
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818CF8', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
        <Car size={16} /> FLEET PERFORMANCE
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 20px' }}>
        Vehicle Model Utilization
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {list.map(item => (
          <div key={item.veh}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{item.veh}</span>
              <span style={{ color: '#94A3B8' }}>
                <strong style={{ color: '#FFF' }}>{item.count} trips</strong> ({item.percent}%)
              </span>
            </div>

            <div
              style={{
                height: '8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${item.percent}%`,
                  background: item.color,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
