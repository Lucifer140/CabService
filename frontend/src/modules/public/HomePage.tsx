import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { SiteData } from '../../types';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import { ScrollToTop } from '../shared/ScrollToTop';
import { Hero } from './components/Hero';
import { BookingWidget } from './components/BookingWidget';
import { FleetSection } from './components/FleetSection';
import { ToursSection } from './components/ToursSection';
import { ServicesSection } from './components/ServicesSection';
import { TestimonialsSection } from './components/TestimonialsSection';

export const HomePage: React.FC = () => {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState('dzire');

  useEffect(() => {
    // 1. Load dynamic settings and fleet data from backend
    api
      .get<SiteData>('/api/public/site-data')
      .then(data => {
        setSiteData(data);
      })
      .catch(err => {
        console.warn('Using default public site data:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 2. Track public page view event
    api
      .post('/api/public/track-event', {
        event_type: 'page_view',
        page_path: '/',
        metadata: { referrer: document.referrer || 'direct' },
      })
      .catch(() => {});
  }, []);

  const phone = siteData?.settings?.business_phone?.replace('+91', '') || '8261021008';
  const whatsapp = siteData?.settings?.business_whatsapp || '918261021008';
  const email = siteData?.settings?.business_email || 'shitalupadhye287@gmail.com';
  const address = siteData?.settings?.business_address || 'Pune, Maharashtra, India';

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#0A0F1D',
        color: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
      }}
    >
      <Header phone={phone} whatsapp={whatsapp} />

      <main id="main-content">
        <Hero

          phone={phone}
          whatsapp={whatsapp}
          onBookNowClick={() => {
            const el = document.getElementById('booking-widget');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <div id="booking-widget" style={{ padding: '0 clamp(16px, 3vw, 24px) 60px' }}>
          <BookingWidget
            selectedVehicleKey={selectedVehicle}
            fleet={siteData?.fleet || []}
            pricingRules={siteData?.pricing || []}
          />
        </div>

        <FleetSection
          fleet={siteData?.fleet || []}
          isLoading={isLoading}
          onSelectVehicle={key => setSelectedVehicle(key)}
        />

        <ToursSection tours={siteData?.tours || []} isLoading={isLoading} />

        <ServicesSection services={siteData?.services || []} isLoading={isLoading} />
        <TestimonialsSection />
      </main>

      <Footer phone={phone} email={email} address={address} />

      {/* Floating Scroll To Top Action Button */}
      <ScrollToTop />
    </div>
  );
};
