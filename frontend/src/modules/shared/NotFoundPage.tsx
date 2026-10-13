import React from 'react';
import { Home, Phone, ArrowLeft, CalendarCheck } from 'lucide-react';

interface NotFoundPageProps {
  phone?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ phone = '8261021008' }) => {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0A0F1D',
        color: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="not-found-card">
        {/* Cab / Road Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(29, 78, 216, 0.1))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '2.5rem',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
          }}
        >
          🚕
        </div>

        {/* 404 Badge */}
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '16px',
            letterSpacing: '0.05em',
          }}
        >
          ERROR 404: WRONG TURN
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
            fontWeight: 900,
            color: '#F8FAFC',
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Destination Not Found
        </h1>

        <p
          style={{
            color: '#94A3B8',
            fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
            lineHeight: 1.6,
            maxWidth: '460px',
            margin: '0 auto 32px',
          }}
        >
          It looks like the route you navigated to has been detoured or doesn't exist on our map.
          Let's get you back on the highway!
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}
        >
          <a
            href="#/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Home size={18} />
            <span>Return to Homepage</span>
          </a>

          <a
            href="#booking-widget"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            <CalendarCheck size={18} color="#60A5FA" />
            <span>Book a Cab</span>
          </a>
        </div>

        {/* Support Help Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '20px',
            fontSize: '0.85rem',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Phone size={14} color="#60A5FA" />
          <span>Need immediate assistance? Call dispatch:</span>
          <a
            href={`tel:+91${phone}`}
            style={{ color: '#93C5FD', fontWeight: 700, textDecoration: 'none' }}
          >
            (+91) {phone}
          </a>
        </div>
      </div>
    </div>
  );
};
