import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface FooterProps {
  phone?: string;
  email?: string;
  address?: string;
}

export const Footer: React.FC<FooterProps> = ({
  phone = '8261021008',
  email = 'shitalupadhye287@gmail.com',
  address = 'Pune, Maharashtra, India',
}) => {
  const { t } = useLanguage();

  return (
    <footer
      id="contact"
      style={{
        background: '#090D1A',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: 'clamp(40px, 6vw, 60px) clamp(16px, 3vw, 24px) 30px',
        color: '#94A3B8',
        fontSize: '0.875rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 'clamp(28px, 4vw, 40px)',
          marginBottom: '40px',
        }}
      >
        {/* Col 1 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.5rem' }}>🚕</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#F8FAFC' }}>
              Sangita Travels Pune
            </span>
          </div>
          <p style={{ lineHeight: 1.6, marginBottom: '18px' }}>
            {t('footer_tagline', 'Your Journey... Our Priority. Premier taxi cab rental services connecting Pune, Mumbai, Mumbai Airport, Shirdi, and tourist getaways across Maharashtra.')}
          </p>
          <div style={{ color: '#10B981', fontWeight: 600 }}>
            {t('footer_active_desk', '● 24/7 Operations & Dispatch Desk Active')}
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0' }}>
            {t('footer_popular_routes', 'Popular Routes')}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2.2 }}>
            <li>
              <a href="#booking-widget" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                Pune to Mumbai Airport T2 Cab
              </a>
            </li>
            <li>
              <a href="#booking-widget" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                Pune to Dadar / Thane One-Way
              </a>
            </li>
            <li>
              <a href="#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                Pune to Shirdi Temple Tour
              </a>
            </li>
            <li>
              <a href="#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                Pune to Mahabaleshwar Holiday
              </a>
            </li>
            <li>
              <a href="#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                Pune to Lonavala Ghat Day Trip
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0' }}>
            {t('footer_contact_support', 'Contact & Support')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={16} color="#60A5FA" style={{ flexShrink: 0 }} />
              <a
                href={`tel:+91${phone}`}
                style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 600 }}
              >
                (+91) {phone}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} color="#60A5FA" style={{ flexShrink: 0 }} />
              <a
                href={`mailto:${email}`}
                style={{
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                }}
              >
                {email}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={16} color="#60A5FA" style={{ flexShrink: 0 }} />
              <span>{address}</span>
            </div>
          </div>
        </div>

        {/* Col 4 */}
        <div>
          <h4 style={{ color: '#F8FAFC', fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0' }}>
            {t('footer_quick_links', 'Quick Links & Policies')}
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2.2 }}>
            <li>
              <a href="#/about" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                About Sangita Travels
              </a>
            </li>
            <li>
              <a href="#/faq" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                Help & FAQs
              </a>
            </li>
            <li>
              <a href="#/contact" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                Contact & Support Desk
              </a>
            </li>
            <li>
              <a href="#/blog" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                Travel Blog & Guides
              </a>
            </li>
            <li>
              <a href="#/track-booking" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
                🔍 Track Your Booking
              </a>
            </li>

            <li>Zero Cancellation Fee up to 2h</li>
            <li>
              <a
                href="#/login"
                style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}
              >
                Admin Portal Login →
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748B',
        }}
      >
        © {new Date().getFullYear()} {t('footer_copyright', 'Sangita Travels Pune. All rights reserved. • Built with modern React & TypeScript.')}
      </div>
    </footer>
  );
};
