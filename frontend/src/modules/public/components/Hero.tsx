import React from 'react';
import { Phone, MessageSquare, Shield, Clock, Award, Star } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

interface HeroProps {
  onBookNowClick?: () => void;
  phone?: string;
  whatsapp?: string;
}

export const Hero: React.FC<HeroProps> = ({
  onBookNowClick,
  phone = '8261021008',
  whatsapp = '918261021008',
}) => {
  const { t } = useLanguage();
  return (
    <div
      style={{
        padding: 'clamp(95px, 12vh, 130px) clamp(16px, 3vw, 24px) clamp(40px, 6vh, 60px)',
        textAlign: 'center',
        position: 'relative',
        maxWidth: '1080px',
        margin: '0 auto',
      }}
    >
      {/* Trust pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '30px',
          padding: '6px clamp(10px, 2vw, 18px)',
          color: '#93C5FD',
          fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)',
          fontWeight: 600,
          marginBottom: '20px',
          maxWidth: '100%',
        }}
      >
        <Star size={15} color="#FACC15" fill="#FACC15" style={{ flexShrink: 0 }} />
        <span className="hero-pill-text">{t('hero_badge', 'Rated 4.9/5 by 12,000+ Travellers in Maharashtra')}</span>
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.85rem, 5vw, 3.8rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          margin: '0 0 18px 0',
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {t('hero_title_prefix', 'Pune to Mumbai Cab Service')}
        <span
          style={{
            display: 'block',
            fontSize: 'clamp(0.95rem, 2.5vw, 1.5rem)',
            color: '#60A5FA',
            WebkitTextFillColor: '#60A5FA',
            marginTop: '10px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {t('hero_title_highlight', 'Doorstep Pickup • Fixed Toll Rates • Chilled AC')}
        </span>
      </h1>

      <p
        style={{
          fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
          color: '#94A3B8',
          maxWidth: '680px',
          margin: '0 auto 32px',
          lineHeight: 1.6,
        }}
      >
        {t('hero_subtitle', 'Experience seamless highway journeys with sanitized sedans, certified drivers & transparent fares. One-way drops to Mumbai Airport starting from just ₹2,299.')}
      </p>

      {/* CTA Buttons */}
      <div
        className="hero-ctas-container"
        style={{
          display: 'flex',
          gap: '14px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '44px',
        }}
      >
        <button
          type="button"
          onClick={onBookNowClick}
          style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            border: 'none',
            borderRadius: '14px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            transition: 'transform 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {t('hero_cta_book', 'Book Your Ride Now')} →
        </button>

        <a
          href={`tel:+91${phone}`}
          style={{
            padding: '14px 24px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '14px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Phone size={18} color="#60A5FA" />
          <span>Call: {phone}</span>
        </a>

        <a
          href={`https://wa.me/${whatsapp}?text=Hello%20Pune%20Taxi%20Cab,%20I%20want%20to%20book%20a%20cab`}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '14px 24px',
            background: 'rgba(37, 211, 102, 0.15)',
            border: '1px solid rgba(37, 211, 102, 0.3)',
            borderRadius: '14px',
            color: '#4ADE80',
            fontSize: '1rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <MessageSquare size={18} />
          <span>{t('hero_cta_whatsapp', 'WhatsApp Us')}</span>
        </a>
      </div>

      {/* Trust Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '28px',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}
        >
          <Shield size={22} color="#3B82F6" style={{ flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#F8FAFC' }}>
              {t('hero_feature_chauffeurs', 'Verified Drivers')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Police background checked</div>
          </div>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}
        >
          <Clock size={22} color="#10B981" style={{ flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#F8FAFC' }}>
              {t('hero_feature_support', '24/7 Cab Dispatch')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Available round the clock</div>
          </div>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}
        >
          <Award size={22} color="#F59E0B" style={{ flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#F8FAFC' }}>
              {t('hero_feature_toll', 'Fixed Fares')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>No surge or hidden fees</div>
          </div>
        </div>
      </div>
    </div>
  );
};
