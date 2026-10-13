import React, { useEffect } from 'react';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import { ShieldCheck, Award, Users, Clock, ThumbsUp, MapPin, ArrowRight, Phone } from 'lucide-react';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'About Us | Sangita Travels Pune — Over 10 Years of Trusted Travel';
  }, []);

  return (
    <div style={{ background: '#0A0F1D', color: '#F8FAFC', minHeight: '100dvh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />

      <main id="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Hero Section */}

        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60A5FA',
              padding: '6px 16px',
              borderRadius: '24px',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <Award size={16} /> Trusted Since 2014
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Empowering Seamless Intercity Journeys
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 'clamp(1rem, 2vw, 1.2rem)', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
            Sangita Travels Pune was founded with a singular mission: to eliminate the stress of commuting between Pune and Mumbai by offering transparent fares, immaculate vehicles, and courteous, highly trained chauffeurs.
          </p>
        </div>

        {/* Milestone Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '70px',
          }}
        >
          {[
            { label: 'Successful Trips', value: '50,000+', icon: <Users size={24} color="#60A5FA" /> },
            { label: 'Google & Direct Rating', value: '4.9 / 5.0', icon: <ThumbsUp size={24} color="#34D399" /> },
            { label: 'Fleet Vehicles', value: '45+ Cabs', icon: <ShieldCheck size={24} color="#FBBF24" /> },
            { label: 'Service Reliability', value: '24/7 Active', icon: <Clock size={24} color="#A78BFA" /> },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '12px' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Our Story & Values */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center',
            marginBottom: '80px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '16px' }}>
              Why Maharashtra Commuters Trust Us
            </h2>
            <p style={{ color: '#94A3B8', lineHeight: 1.7, marginBottom: '20px' }}>
              We recognize that travelers between Pune and Mumbai represent diverse needs: IT executives rushing for international flights from Mumbai T2, families planning spiritual pilgrimages to Shirdi, or tourists exploring the scenic Western Ghats.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { title: 'Zero Surge Pricing', desc: 'Pre-fixed, all-inclusive pricing without surprise toll or holiday surge fees.' },
                { title: 'Doorstep Pick & Drop', desc: 'From Kothrud, Hinjewadi, or Viman Nagar straight to any terminal or residence in Mumbai.' },
                { title: 'Police-Verified Chauffeurs', desc: 'Experienced drivers with extensive Mumbai-Pune Expressway night-driving safety records.' },
                { title: 'Instant Confirmation', desc: 'Automated booking confirmations via SMS, Email, and WhatsApp within seconds.' },
              ].map((val, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA', flexShrink: 0, marginTop: '2px' }}>
                    ✓
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#F8FAFC', fontWeight: 700 }}>{val.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.5 }}>{val.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              background: '#0F172A',
            }}
          >
            <img
              src="assets/images/innova.png"
              alt="Sangita Travels Innova Crysta Cab"
              style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(10, 15, 29, 0.95), transparent)',
                padding: '24px',
              }}
            >
              <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>
                Clean, Sanitized & Premium Fleet
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                Sedans (Dzire, Aura), MPVs (Ertiga), Luxury SUVs (Innova Crysta), and Tempo Travellers.
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 12px' }}>
            Ready to Travel with Peace of Mind?
          </h3>
          <p style={{ color: '#94A3B8', maxWidth: '580px', margin: '0 0 24px', lineHeight: 1.6 }}>
            Book online in under 60 seconds with zero advance required, or speak with our 24/7 travel desk.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="#/"
              style={{
                background: '#2563eb',
                color: '#FFFFFF',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
              }}
            >
              Book Cab Online <ArrowRight size={18} />
            </a>
            <a
              href="tel:+918261021008"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
                padding: '14px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <Phone size={18} /> +91 8261021008
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
