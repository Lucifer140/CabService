import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Phone,
  MessageCircle,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  // Booking & Reservations
  {
    id: 'b1',
    category: 'Booking & Scheduling',
    question: 'How do I book a Pune to Mumbai cab with Sangita Travels?',
    answer: 'You can book directly via our online booking widget on the homepage in under 60 seconds, call our dispatch desk at +91 8261021008, or send a quick WhatsApp message to +91 8261021008. You will receive immediate booking confirmation with driver assignment details.',
  },
  {
    id: 'b2',
    category: 'Booking & Scheduling',
    question: 'How far in advance should I book my cab?',
    answer: 'We accept immediate rides with as little as 30–45 minutes advance notice in Pune or Mumbai. However, for airport drops, early morning flights, or holiday weekends (e.g. Lonavala or Mahabaleshwar tours), we recommend booking 12 to 24 hours in advance to guarantee your preferred vehicle model.',
  },
  {
    id: 'b3',
    category: 'Booking & Scheduling',
    question: 'Can I cancel or reschedule my booking? Are there cancellation fees?',
    answer: 'Yes, cancellations made up to 2 hours before the scheduled pickup time incur zero cancellation charge! Any token advance paid will be credited back or adjusted to your rescheduled trip.',
  },

  // Fares & Tolls
  {
    id: 'f1',
    category: 'Fares & Payments',
    question: 'Are toll charges included in the estimated fare?',
    answer: 'Our one-way and round-trip packages have transparent pricing. Expressway toll charges (Mumbai-Pune Yashwantrao Chavan Expressway toll approx ₹320) and Atal Setu (MTHL) tolls can be chosen as all-inclusive or paid directly at the toll plazas. We provide complete itemized receipts with zero hidden surcharges.',
  },
  {
    id: 'f2',
    category: 'Fares & Payments',
    question: 'What payment methods do you accept?',
    answer: 'We support all major payment modes: Google Pay, PhonePe, Paytm, UPI QR code on the driver dashboard, Razorpay online debit/credit cards, Net Banking, and cash directly to the chauffeur upon arrival.',
  },
  {
    id: 'f3',
    category: 'Fares & Payments',
    question: 'Is there any night driving surcharge or driver allowance?',
    answer: 'For standard one-way intercity drops between Pune and Mumbai, there are no surprise night surcharges. For outstation multi-day tours exceeding 10:00 PM, a standard night driver allowance (₹300) applies as indicated during booking.',
  },

  // Airport Transfers
  {
    id: 'a1',
    category: 'Airport Drops & Pickups',
    question: 'Do you provide direct drop to Mumbai Airport (T1 & T2)?',
    answer: 'Yes! Pune to Mumbai International Airport (CSMIA Terminal 2) and Domestic Airport (Terminal 1) is our signature 24/7 service. Our chauffeurs monitor live flight delays and drop you directly at the departure ramps with ample buffer time.',
  },
  {
    id: 'a2',
    category: 'Airport Drops & Pickups',
    question: 'What happens if my incoming flight to Mumbai is delayed?',
    answer: 'When booking an airport pickup from Mumbai to Pune, provide your flight number. Our dispatch team tracks your flight status. Your driver will wait at the airport parking / arrival gate without penalizing you for airline delays up to 60 minutes.',
  },

  // Vehicles & Comfort
  {
    id: 'v1',
    category: 'Vehicles & Luggage',
    question: 'Which car should I choose for my trip?',
    answer: 'For 1 to 4 passengers with 2 bags, Sedan (Maruti Dzire / Etios) is economical and comfortable. For 4 to 6 passengers or families carrying multiple suitcases, Ertiga or Toyota Innova Crysta is ideal. For group tours of 10 to 17 people, our AC Tempo Travellers offer pushback seats and high luggage racks.',
  },
  {
    id: 'v2',
    category: 'Vehicles & Luggage',
    question: 'Are all cabs air-conditioned and well-maintained?',
    answer: 'Absolutely. Every vehicle in the Sangita Travels fleet is under 4 years old, certified commercial T-permit, GPS-monitored, thoroughly cleaned, sanitized before each trip, and features functional front and rear air-conditioning.',
  },

  // Safety & Hygiene
  {
    id: 's1',
    category: 'Safety & Chauffeurs',
    question: 'Are the chauffeurs verified and experienced on the Expressway?',
    answer: 'All our chauffeurs possess commercial passenger vehicle licenses, verified police credentials, and minimum 5+ years of highway driving experience navigating the Western Ghats (Khandala Ghat) safely in all weather conditions.',
  },
  {
    id: 's2',
    category: 'Safety & Chauffeurs',
    question: 'Is it safe for solo female travelers at night?',
    answer: 'Yes, 100%. Safety is our utmost priority. All rides are GPS-tracked with live telemetry in our central dispatch office. You can share real-time live tracking links with family members, and emergency 24/7 assistance is always active on phone and WhatsApp.',
  },
];

const CATEGORIES = [
  'All',
  'Booking & Scheduling',
  'Fares & Payments',
  'Airport Drops & Pickups',
  'Vehicles & Luggage',
  'Safety & Chauffeurs',
];

export const FAQPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ b1: true, f1: true });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Frequently Asked Questions (FAQ) | Sangita Travels Pune';
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div
      style={{
        background: '#0A0F1D',
        color: '#F8FAFC',
        minHeight: '100dvh',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <Header />

      <main id="main-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Header Hero */}

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
            <HelpCircle size={16} /> Help & Knowledge Base
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
              fontWeight: 800,
              margin: '0 0 16px',
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
            }}
          >
            Frequently Asked Questions
          </h1>
          <p
            style={{
              color: '#94A3B8',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Everything you need to know about booking, transparent fares, expressway tolls, airport pickups, and vehicle safety between Pune and Mumbai.
          </p>
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            maxWidth: '640px',
            margin: '0 auto 36px',
          }}
        >
          <Search
            size={20}
            color="#64748B"
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search questions (e.g. tolls, airport delay, cancellation, innova)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 20px 16px 50px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              color: '#F8FAFC',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: isActive
                    ? '1px solid #3B82F6'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isActive ? '#2563EB' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#FFFFFF' : '#CBD5E1',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '60px' }}>
          {filteredFaqs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <HelpCircle size={40} color="#64748B" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#E2E8F0', marginBottom: '8px' }}>
                No matching questions found
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.95rem', margin: 0 }}>
                Try adjusting your search query or connect with our support team directly.
              </p>
            </div>
          ) : (
            filteredFaqs.map(faq => {
              const isOpen = !!openItems[faq.id];
              return (
                <div
                  key={faq.id}
                  style={{
                    background: isOpen ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.5)',
                    border: isOpen
                      ? '1px solid rgba(59, 130, 246, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      background: 'none',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60A5FA',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {faq.category.split(' ')[0]}
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown
                      size={20}
                      color={isOpen ? '#60A5FA' : '#94A3B8'}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 24px 22px',
                        color: '#94A3B8',
                        fontSize: '0.975rem',
                        lineHeight: 1.7,
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        paddingTop: '16px',
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions CTA */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '24px',
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF' }}>
            Still have questions or special requirements?
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Our 24/7 Pune-Mumbai operations control room is available around the clock to assist you with custom quotes, group bookings, and special itinerary requests.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="tel:+918261021008"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
              }}
            >
              <Phone size={18} /> Call +91 8261021008
            </a>
            <a
              href="https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20have%20a%20question%20about%20booking%20a%20cab"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#25D366',
                color: '#000000',
                padding: '12px 24px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(37, 211, 102, 0.25)',
              }}
            >
              <MessageCircle size={18} /> WhatsApp 24/7 Desk
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
