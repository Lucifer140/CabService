import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { HomePage } from './modules/public/HomePage';
import { ErrorBoundary } from './modules/shared/ErrorBoundary';

const LoginPage = lazy(() => import('./modules/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import('./modules/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const AboutPage = lazy(() => import('./modules/public/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./modules/public/ContactPage').then(m => ({ default: m.ContactPage })));
const FAQPage = lazy(() => import('./modules/public/FAQPage').then(m => ({ default: m.FAQPage })));
const TourDetailPage = lazy(() => import('./modules/public/TourDetailPage').then(m => ({ default: m.TourDetailPage })));
const TrackBookingPage = lazy(() => import('./modules/public/TrackBookingPage').then(m => ({ default: m.TrackBookingPage })));
const BlogPage = lazy(() => import('./modules/public/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import('./modules/public/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const NotFoundPage = lazy(() => import('./modules/shared/NotFoundPage').then(m => ({ default: m.NotFoundPage })));



const AppRoutes: React.FC = () => {
  const [route, setRoute] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '') || '/';
    return hash;
  });

  const { token, isLoading } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      setRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#0A0F1D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#60A5FA',
          fontSize: '1.1rem',
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Loading Sangita Travels...
      </div>
    );
  }

  // Admin Login Route (/admin/login or /login)
  if (route === '/admin/login' || route === 'admin/login' || route === '/login' || route === 'login') {
    if (token) {
      window.location.hash = '#/admin/dashboard';
      return null;
    }
    return (
      <LoginPage
        onLoginSuccess={() => {
          window.location.hash = '#/admin/dashboard';
        }}
      />
    );
  }

  // Protected Admin Routes (/admin, /admin/dashboard, /admin/users, etc.)
  if (route.startsWith('/admin') || route === 'admin') {
    if (!token) {
      window.location.hash = '#/admin/login';
      return (
        <LoginPage
          onLoginSuccess={() => {
            window.location.hash = '#/admin/dashboard';
          }}
        />
      );
    }
    if (route === '/admin' || route === 'admin') {
      window.location.hash = '#/admin/dashboard';
      return null;
    }
    return <AdminPage />;
  }
  // About Page Route
  if (route === '/about' || route === 'about' || route.startsWith('/about')) {
    return <AboutPage />;
  }

  // Contact Page Route
  if (route === '/contact' || route === 'contact' || route.startsWith('/contact')) {
    return <ContactPage />;
  }

  // FAQ Page Route
  if (route === '/faq' || route === 'faq' || route.startsWith('/faq')) {
    return <FAQPage />;
  }

  // Tour Detail Route: /tours/:slug or tours/:slug
  if (route.startsWith('/tours/') || (route.startsWith('tours/') && route !== 'tours')) {
    const slug = route.replace(/^\/?tours\//, '').split('?')[0].split('#')[0];
    if (slug) {
      return <TourDetailPage slug={slug} />;
    }
  }

  // Track Booking Route
  if (route.startsWith('/track-booking') || route.startsWith('track-booking') || route.startsWith('/track')) {
    return <TrackBookingPage />;
  }

  // Blog Article Reader Route: /blog/:slug
  if (route.startsWith('/blog/') || (route.startsWith('blog/') && route !== 'blog')) {
    const slug = route.replace(/^\/?blog\//, '').split('?')[0].split('#')[0];
    if (slug) {
      return <BlogPostPage slug={slug} />;
    }
  }

  // Blog List Route: /blog
  if (route === '/blog' || route === 'blog' || route.startsWith('/blog?')) {
    return <BlogPage />;
  }


  // Home Page Routes & Anchor Hashes
  const isHomeRoute =
    route === '/' ||
    route === '' ||
    route === '/#' ||
    route.startsWith('booking-widget') ||
    route.startsWith('fleet') ||
    route.startsWith('tours') ||
    route.startsWith('services') ||
    route.startsWith('/?');

  if (isHomeRoute) {
    return <HomePage />;
  }

  // Unrecognized Route -> 404 Not Found Page
  return <NotFoundPage />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: '100dvh',
                  background: '#0A0F1D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60A5FA',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Loading Sangita Travels...
              </div>
            }
          >
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

