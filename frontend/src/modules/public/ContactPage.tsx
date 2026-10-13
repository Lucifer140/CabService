import React, { useState, useEffect } from 'react';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'Pune to Mumbai Cab Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Contact Us | Sangita Travels Pune — 24/7 Helpline & Cab Booking';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/public/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'contact_form_submission',
          page_path: '/contact',
          metadata: formData,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0A0F1D', color: '#F8FAFC', minHeight: '100dvh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />

      <main id="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>

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
            <Clock size={16} /> 24/7 Active Customer Helpline
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, margin: '0 0 16px', color: '#FFFFFF' }}>
            Get in Touch with Sangita Travels
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Have a question about route rates, airport pickup, outstation tour packages, or custom wedding rentals? Our team is available 24/7.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            marginBottom: '60px',
          }}
        >
          {/* Contact Details & Direct CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '30px',
              }}
            >
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 20px', color: '#F8FAFC' }}>
                Instant Contact Options
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <a
                  href="tel:+918261021008"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '14px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <div style={{ padding: '10px', background: '#2563eb', borderRadius: '10px', color: '#fff' }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>24/7 Phone Helpline</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>+91 8261021008</div>
                  </div>
                </a>

                <a
                  href="https://wa.me/918261021008?text=Hello%20Sangita%20Travels%2C%20I%20need%20a%20Pune%20to%20Mumbai%20cab%20inquiry."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '14px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div style={{ padding: '10px', background: '#10B981', borderRadius: '10px', color: '#fff' }}>
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Direct WhatsApp Chat</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>Chat on WhatsApp</div>
                  </div>
                </a>

                <a
                  href="mailto:contact@sangitatravelspune.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Email Address</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>contact@sangitatravelspune.com</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Operating Office Locations */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
              }}
            >
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px', color: '#F8FAFC' }}>
                Key Operating Hubs in Maharashtra
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: '#94A3B8' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={18} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#F8FAFC' }}>Pune Central Office:</strong> Shop 4, Near Pune Railway Station, Agarkar Nagar, Pune - 411001.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={18} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#F8FAFC' }}>Hinjewadi Tech Hub:</strong> Phase 1 IT Park, Hinjewadi, Pune - 411057.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={18} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#F8FAFC' }}>Mumbai Airport Desk:</strong> Terminal 2 (T2) Arrivals Exit, Sahar, Andheri East, Mumbai - 400099.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Inquiry Form */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '36px',
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle2 size={64} color="#10B981" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '10px' }}>
                  Message Received!
                </h3>
                <p style={{ color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px' }}>
                  Thank you for reaching out. One of our travel coordinators will call you back within 15 minutes.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: '#F8FAFC' }}>
                  Send an Inquiry
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '0 0 12px' }}>
                  Leave your details and travel requirement. We will reply promptly with full rate details.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Anand Shinde"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Phone (10-Digit) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9822XXXXXX"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@email.com"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                    Trip Details & Inquiry Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your pickup location in Pune, drop point in Mumbai, preferred dates, vehicle type, or specific requirements..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
                    marginTop: '8px',
                  }}
                >
                  {loading ? 'Sending Message...' : <><Send size={18} /> Submit Travel Inquiry</>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Embedded Google Map Preview */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px', color: '#F8FAFC' }}>
              Mumbai-Pune Expressway Route Map
            </h3>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
              Standard route: 152 km via Yashwantrao Chavan Expressway with doorstep connectivity across Maharashtra.
            </p>
          </div>
          <iframe
            title="Pune Mumbai Cab Route Map"
            src="https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d483256.4026368817!2d73.08573268571873!3d18.895311029272895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x3bc2bf2e67461101%3A0x828d43bf9d9ee343!2sPune%2C%20Maharashtra!3m2!1d18.5204303!2d73.8567437!4m5!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!3m2!1d19.0759837!2d72.8776559!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
            width="100%"
            height="380"
            style={{ border: 0, display: 'block' }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};
