import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AdminLayout } from './AdminLayout';

const DashboardView = lazy(() => import('./pages/DashboardView').then(m => ({ default: m.DashboardView })));
const BookingsView = lazy(() => import('./pages/BookingsView').then(m => ({ default: m.BookingsView })));
const CustomersView = lazy(() => import('./pages/CustomersView').then(m => ({ default: m.CustomersView })));
const FleetView = lazy(() => import('./pages/FleetView').then(m => ({ default: m.FleetView })));
const DriversView = lazy(() => import('./pages/DriversView').then(m => ({ default: m.DriversView })));
const ToursView = lazy(() => import('./pages/ToursView').then(m => ({ default: m.ToursView })));
const ServicesView = lazy(() => import('./pages/ServicesView').then(m => ({ default: m.ServicesView })));
const PricingView = lazy(() => import('./pages/PricingView').then(m => ({ default: m.PricingView })));
const CouponsView = lazy(() => import('./pages/CouponsView').then(m => ({ default: m.CouponsView })));
const CmsView = lazy(() => import('./pages/CmsView').then(m => ({ default: m.CmsView })));
const BlogView = lazy(() => import('./pages/BlogView').then(m => ({ default: m.BlogView })));
const ReviewsView = lazy(() => import('./pages/ReviewsView').then(m => ({ default: m.ReviewsView })));
const SeoView = lazy(() => import('./pages/SeoView').then(m => ({ default: m.SeoView })));
const AnalyticsView = lazy(() => import('./pages/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const MediaView = lazy(() => import('./pages/MediaView').then(m => ({ default: m.MediaView })));
const UsersView = lazy(() => import('./pages/UsersView').then(m => ({ default: m.UsersView })));
const SettingsView = lazy(() => import('./pages/SettingsView').then(m => ({ default: m.SettingsView })));
const AuditLogsView = lazy(() => import('./pages/AuditLogsView').then(m => ({ default: m.AuditLogsView })));


export const AdminPage: React.FC = () => {
  const { user, token } = useAuth();

  const getTabFromHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash.startsWith('admin/')) {
      const sub = hash.replace('admin/', '').split('?')[0];
      if (sub && sub !== 'login') {
        return sub;
      }
    }
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState(getTabFromHash);

  React.useEffect(() => {
    const handleHash = () => {
      const tab = getTabFromHash();
      setCurrentTab(tab);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (!token || !user) {
    window.location.hash = '#/admin/login';
    return null;
  }

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = `#/admin/${tab}`;
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigateToBookings={() => setCurrentTab('bookings')} />;
      case 'bookings':
        return <BookingsView />;
      case 'customers':
        return <CustomersView />;
      case 'fleet':
        return <FleetView />;
      case 'drivers':
        return <DriversView />;
      case 'tours':
        return <ToursView />;
      case 'services':
        return <ServicesView />;
      case 'pricing':
        return <PricingView />;
      case 'coupons':
        return <CouponsView />;
      case 'cms':
        return <CmsView />;
      case 'blog':
        return <BlogView />;
      case 'reviews':
        return <ReviewsView />;

      case 'seo':
        return <SeoView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'media':
        return <MediaView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      case 'audit-logs':
        return <AuditLogsView />;
      default:
        return <DashboardView onNavigateToBookings={() => handleTabChange('bookings')} />;
    }
  };

  return (
    <AdminLayout currentTab={currentTab} onTabChange={handleTabChange}>
      <Suspense
        fallback={
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#60A5FA',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Loading dashboard module...
          </div>
        }
      >
        {renderContent()}
      </Suspense>
    </AdminLayout>
  );
};

