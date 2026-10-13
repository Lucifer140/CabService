import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  Shield,
  Menu,
  X,
  Car,
  Compass,
  Briefcase,
  CalendarCheck,
  ChevronRight,
  Info,
  HelpCircle,
  Mail,
  Search,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageToggle } from '../../i18n/LanguageToggle';

interface HeaderProps {
  onAdminClick?: () => void;
  phone?: string;
  whatsapp?: string;
}

export const Header: React.FC<HeaderProps> = ({
  phone = '8261021008',
  whatsapp = '918261021008',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const { t } = useLanguage();

  const navLinks = [
    { label: t('nav_book_ride', 'Book Ride'), href: '#booking-widget', icon: CalendarCheck },
    { label: t('nav_track_ride', 'Track Ride'), href: '#/track-booking', icon: Search },
    { label: t('nav_fleet', 'Fleet Rates'), href: '#fleet', icon: Car },
    { label: t('nav_tours', 'Tour Packages'), href: '#tours', icon: Compass },
    { label: t('nav_services', 'Services'), href: '#services', icon: Briefcase },
    { label: t('nav_blog', 'Blog'), href: '#/blog', icon: BookOpen },
    { label: t('nav_about', 'About Us'), href: '#/about', icon: Info },
    { label: t('nav_faq', 'FAQ'), href: '#/faq', icon: HelpCircle },
    { label: t('nav_contact', 'Contact'), href: '#/contact', icon: Mail },
  ];


  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header

        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '74px',
          background: 'rgba(10, 15, 29, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 3vw, 32px)',
        }}
      >
        {/* Brand Logo & Name */}
        <a
          href="#/"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🚕</span>
          </div>
          <div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                color: '#F8FAFC',
                display: 'block',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Sangita Travels
            </span>
            <span
              className="brand-subtext"
              style={{
                fontSize: '0.72rem',
                color: '#60A5FA',
                fontWeight: 700,
                letterSpacing: '0.06em',
                display: 'block',
              }}
            >
              PUNE MUMBAI CAB
            </span>
          </div>
        </a>

        {/* Desktop Nav Links (Visible >= 960px) */}
        <nav
          className="desktop-nav"
          style={{ gap: '28px', alignItems: 'center' }}
          aria-label="Main Navigation"
        >
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                color: '#CBD5E1',
                textDecoration: 'none',
                fontSize: '0.925rem',
                fontWeight: 600,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Contact CTAs (Visible >= 960px) */}
        <div className="header-ctas-desktop" style={{ alignItems: 'center', gap: '12px' }}>
          <LanguageToggle compact />

          <a
            href={`tel:+91${phone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              color: '#93C5FD',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              transition: 'background 0.2s',
            }}
          >
            <Phone size={15} />
            <span>{phone}</span>
          </a>

          <a
            href={`https://wa.me/${whatsapp}?text=Hello%20Pune%20Taxi%20Cab,%20I%20want%20to%20book%20a%20cab`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#25D366',
              borderRadius: '10px',
              color: '#000000',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            }}
          >
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </a>

          <a
            href="#/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#CBD5E1',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
            title="Admin Staff Login"
          >
            <Shield size={15} color="#94A3B8" />
            <span>{t('nav_staff_login', 'Staff Login')}</span>
          </a>
        </div>

        {/* Mobile Header Right Controls (< 960px) */}
        <div className="header-ctas-mobile" style={{ alignItems: 'center', gap: '8px' }}>
          {/* Quick Call Button on Mobile */}
          <a
            href={`tel:+91${phone}`}
            aria-label={`Call ${phone}`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#93C5FD',
            }}
          >
            <Phone size={18} />
          </a>

          {/* Quick WhatsApp Button on Mobile */}
          <a
            href={`https://wa.me/${whatsapp}?text=Hello%20Pune%20Taxi%20Cab,%20I%20want%20to%20book%20a%20cab`}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
            }}
          >
            <MessageCircle size={19} />
          </a>

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div className="mobile-drawer-content">
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🚕</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#F8FAFC' }}>
                    Sangita Travels
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#60A5FA', fontWeight: 700 }}>
                    PUNE MUMBAI CAB
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Language Selector */}
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>Language / भाषा</span>
              <LanguageToggle />
            </div>

            {/* Nav Links List */}
            <nav style={{ padding: '20px 16px', flex: 1, overflowY: 'auto' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '10px',
                  paddingLeft: '8px',
                }}
              >
                Menu Navigation
              </div>

              {navLinks.map(link => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#E2E8F0',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      marginBottom: '6px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#60A5FA',
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight size={16} color="#64748B" />
                  </a>
                );
              })}
            </nav>

            {/* Drawer Bottom Actions */}
            <div
              style={{
                padding: '20px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(10, 15, 29, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <a
                href={`tel:+91${phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  borderRadius: '12px',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.925rem',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                <Phone size={16} />
                <span>Call (+91) {phone}</span>
              </a>

              <a
                href={`https://wa.me/${whatsapp}?text=Hello%20Pune%20Taxi%20Cab,%20I%20want%20to%20book%20a%20cab`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#25D366',
                  borderRadius: '12px',
                  color: '#000',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.925rem',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)',
                }}
              >
                <MessageCircle size={18} />
                <span>WhatsApp Booking</span>
              </a>

              <a
                href="#/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: '#94A3B8',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  marginTop: '4px',
                }}
              >
                <Shield size={14} color="#64748B" />
                <span>{t('nav_staff_login', 'Staff Admin Login')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
