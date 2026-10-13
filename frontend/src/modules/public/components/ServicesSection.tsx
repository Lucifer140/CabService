import React from 'react';
import { Service } from '../../../types';
import {
  Route,
  Navigation,
  Plane,
  Compass,
  Clock,
  Briefcase,
  Users,
  Car,
  Shield,
} from 'lucide-react';
import { ServicesSkeleton } from '../../shared/Skeleton';

interface ServicesSectionProps {
  services: Service[];
  isLoading?: boolean;
}

const getServiceIcon = (iconName?: string) => {
  const iconKey = (iconName || '').trim().toLowerCase();
  const iconProps = { size: 26, color: '#60A5FA', strokeWidth: 2 };

  switch (iconKey) {
    case 'route':
      return <Route {...iconProps} />;
    case 'navigation':
      return <Navigation {...iconProps} />;
    case 'plane':
    case 'flight':
    case 'airport':
      return <Plane {...iconProps} />;
    case 'compass':
    case 'outstation':
      return <Compass {...iconProps} />;
    case 'clock':
    case 'time':
    case 'hourly':
      return <Clock {...iconProps} />;
    case 'briefcase':
    case 'corporate':
    case 'business':
      return <Briefcase {...iconProps} />;
    case 'users':
    case 'group':
    case 'wedding':
      return <Users {...iconProps} />;
    case 'shield':
    case 'safety':
      return <Shield {...iconProps} />;
    case 'car':
      return <Car {...iconProps} />;
    default:
      if (iconName && iconName.length <= 4) {
        return <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{iconName}</span>;
      }
      return <Car {...iconProps} />;
  }
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  isLoading = false,
}) => {
  const defaultServices: Partial<Service>[] = [
    {
      title: 'Mumbai Airport Transfers (T1 & T2)',
      icon: 'plane',
      description:
        'Guaranteed on-time drop & pickup from Pune to Mumbai International / Domestic airport with flight tracking.',
      short_desc:
        'Guaranteed on-time drop & pickup from Pune to Mumbai International / Domestic airport with flight tracking.',
    },
    {
      title: 'One-Way & Return Outstation Cabs',
      icon: 'route',
      description:
        'Pay only for one-way distance without paying return fare. Clean, verified drivers for safe highway journeys.',
      short_desc:
        'Pay only for one-way distance without paying return fare. Clean, verified drivers for safe highway journeys.',
    },
    {
      title: 'Corporate Travel & Executive Rental',
      icon: 'briefcase',
      description:
        'GST registered tax invoices, dedicated account manager, clean sedans & luxury SUVs for corporate delegates.',
      short_desc:
        'GST registered tax invoices, dedicated account manager, clean sedans & luxury SUVs for corporate delegates.',
    },
    {
      title: 'Local Hourly Rentals in Pune',
      icon: 'clock',
      description:
        '8 Hours / 80 Km or 12 Hours / 120 Km packages for city shopping, business meetings and local sightseeing.',
      short_desc:
        '8 Hours / 80 Km or 12 Hours / 120 Km packages for city shopping, business meetings and local sightseeing.',
    },
  ];

  const displayServices = services.length > 0 ? services : defaultServices;

  return (
    <section
      id="services"
      style={{
        padding: 'clamp(50px, 8vw, 80px) clamp(16px, 3vw, 24px)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#FACC15',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          What We Offer
        </div>
        <h2
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
            fontWeight: 800,
            margin: '0 0 12px 0',
            color: '#F8FAFC',
          }}
        >
          Comprehensive Taxi & Travel Solutions
        </h2>
        <p
          style={{
            color: '#94A3B8',
            fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          Reliable chauffeur-driven car rentals tailored for tourists, executives, and families
          across Maharashtra.
        </p>
      </div>

      {isLoading ? (
        <ServicesSkeleton count={4} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '24px',
          }}
        >
          {displayServices.map((srv, idx) => (
            <div
              key={srv.id || idx}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: 'clamp(20px, 3vw, 28px)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.12)',
                }}
              >
                {getServiceIcon(srv.icon)}
              </div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#F8FAFC',
                  margin: '0 0 10px 0',
                }}
              >
                {srv.title}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                {srv.description || srv.short_desc}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
