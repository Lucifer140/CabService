import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Car,
  Compass,
  Briefcase,
  FileText,
  Image,
  DollarSign,
  Search,
  BarChart3,
  UserCheck,
  Settings,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Menu,
  X,
  MessageSquare,
  Tag,
  BookOpen,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onTabChange, children }) => {
  const { user, logout, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on ESC key or on window resize to desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard' },
    { id: 'bookings', label: 'Bookings Desk', icon: CalendarCheck, perm: 'bookings:read' },
    { id: 'customers', label: 'Customer CRM', icon: Users, perm: 'customers:read' },
    { id: 'fleet', label: 'Vehicle Fleet', icon: Car, perm: 'fleet:read' },
    { id: 'drivers', label: 'Fleet Chauffeurs', icon: UserCheck, perm: 'fleet:read' },
    { id: 'tours', label: 'Tour Packages', icon: Compass, perm: 'tours:read' },
    { id: 'services', label: 'Rental Services', icon: Briefcase, perm: 'services:read' },
    { id: 'cms', label: 'Website CMS', icon: FileText, perm: 'content:read' },
    { id: 'blog', label: 'Blog & Articles', icon: BookOpen, perm: 'content:read' },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, perm: 'content:read' },
    { id: 'media', label: 'Media Library', icon: Image, perm: 'media:read' },
    { id: 'pricing', label: 'Pricing Rules', icon: DollarSign, perm: 'pricing:read' },
    { id: 'coupons', label: 'Coupons & Promos', icon: Tag, perm: 'pricing:read' },

    { id: 'seo', label: 'SEO Settings', icon: Search, perm: 'seo:read' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics:read' },
    { id: 'users', label: 'Admin Users', icon: UserCheck, perm: 'SUPER_ADMIN' },
    { id: 'settings', label: 'System Settings', icon: Settings, perm: 'SUPER_ADMIN' },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert, perm: 'SUPER_ADMIN' },
  ];

  const allowedNav = navItems.filter(item => hasPermission(item.perm));

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: '#0B1120',
        color: '#E2E8F0',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
      }}
    >
      {/* Mobile Sidebar Overlay Backdrop */}
      <div
        className={`admin-sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand & Mobile Close */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              🚕
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.975rem', color: '#F8FAFC' }}>
                Sangita Travels
              </div>
              <div style={{ fontSize: '0.68rem', color: '#60A5FA', fontWeight: 700 }}>
                ADMIN CONTROL DESK
              </div>
            </div>
          </div>

          {/* Close button inside sidebar on mobile */}
          <button
            type="button"
            className="admin-mobile-header-toggle"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar menu"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation items list */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {allowedNav.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#60A5FA' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#60A5FA' : '#94A3B8'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Badge & Logout */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#F8FAFC',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.full_name || 'Admin Staff'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 600 }}>
                {user?.role?.replace('_', ' ') || 'STAFF'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>

          <a
            href="#/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '0.75rem',
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <span>View Public Site</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-content">
        {/* Top Navbar */}
        <header
          style={{
            height: '64px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 clamp(16px, 3vw, 28px)',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Hamburger button visible on mobile (<1024px) */}
            <button
              type="button"
              className="admin-mobile-header-toggle"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Open sidebar menu"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F8FAFC',
                borderRadius: '8px',
                padding: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Menu size={20} />
            </button>

            <span
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                fontWeight: 700,
                color: '#F8FAFC',
                textTransform: 'capitalize',
              }}
            >
              {currentTab.replace('-', ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34D399',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#34D399',
                  display: 'inline-block',
                }}
              />
              Database Live
            </span>
          </div>
        </header>

        {/* Tab Body */}
        <main
          style={{
            padding: 'clamp(16px, 2.5vw, 28px)',
            flex: 1,
            width: '100%',
            overflowX: 'hidden',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
