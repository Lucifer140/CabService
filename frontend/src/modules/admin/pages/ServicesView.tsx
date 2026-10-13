import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../services/api';
import { Service } from '../../../types';
import { Modal } from '../../shared/Modal';
import { Toast } from '../../shared/Toast';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  EyeOff,
  Upload,
  AlertTriangle,
  RefreshCw,
  Route,
  Navigation,
  Plane,
  Compass,
  Clock,
  Users,
  Car,
  Shield,
  MapPin,
  Calendar,
  Zap,
  X,
} from 'lucide-react';

// Preset icons for the interactive visual picker
const PRESET_ICONS = [
  { key: 'car', label: 'Car / Sedan', icon: Car },
  { key: 'route', label: 'Route / Distance', icon: Route },
  { key: 'navigation', label: 'Navigation', icon: Navigation },
  { key: 'plane', label: 'Airport / Flight', icon: Plane },
  { key: 'compass', label: 'Outstation Tour', icon: Compass },
  { key: 'clock', label: 'Hourly / Time', icon: Clock },
  { key: 'briefcase', label: 'Corporate / Travel', icon: Briefcase },
  { key: 'users', label: 'Group / Wedding', icon: Users },
  { key: 'shield', label: 'Safety / Verified', icon: Shield },
  { key: 'mappin', label: 'Local / City', icon: MapPin },
  { key: 'calendar', label: 'Event / Booking', icon: Calendar },
  { key: 'zap', label: 'Express / Fast', icon: Zap },
];

/**
 * Helper to render vector Lucide icon or fallback emoji
 */
const renderServiceIcon = (iconName?: string, size = 20, color = '#60A5FA') => {
  const iconKey = (iconName || '').trim().toLowerCase();
  const iconProps = { size, color, strokeWidth: 2 };

  switch (iconKey) {
    case 'route':
      return <Route {...iconProps} />;
    case 'navigation':
      return <Navigation {...iconProps} />;
    case 'plane':
    case 'flight':
    case 'airport':
      return <Plane {...iconProps} />;
    case 'compass':
    case 'outstation':
      return <Compass {...iconProps} />;
    case 'clock':
    case 'time':
    case 'hourly':
      return <Clock {...iconProps} />;
    case 'briefcase':
    case 'corporate':
    case 'business':
      return <Briefcase {...iconProps} />;
    case 'users':
    case 'group':
    case 'wedding':
      return <Users {...iconProps} />;
    case 'shield':
    case 'safety':
      return <Shield {...iconProps} />;
    case 'mappin':
    case 'city':
    case 'local':
      return <MapPin {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'zap':
    case 'express':
      return <Zap {...iconProps} />;
    case 'car':
    case 'sedan':
    case 'cab':
      return <Car {...iconProps} />;
    default:
      if (iconName && iconName.length <= 4) {
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{iconName}</span>;
      }
      return <Car {...iconProps} />;
  }
};

export const ServicesView: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('car');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState<number>(1);
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; services: Service[] }>('/api/services');
      if (res.success) {
        setServices(res.services || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load rental services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get<{ success: boolean; services: Service[] }>('/api/services')
      .then(res => {
        if (active && res.success) {
          setServices(res.services || []);
        }
      })
      .catch((err: any) => {
        if (active) {
          showToast(err.message || 'Failed to load rental services', 'error');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setTitle(service.title || '');
      setSlug(service.slug || '');
      setDescription(service.description || service.short_desc || '');
      setIcon(service.icon || 'car');
      setImageUrl(service.image_url || '');
      setIsActive(service.is_active !== undefined ? service.is_active : 1);
      setDisplayOrder(service.display_order !== undefined ? service.display_order : 0);
    } else {
      setEditingService(null);
      setTitle('');
      setSlug('');
      setDescription('');
      setIcon('car');
      setImageUrl('');
      setIsActive(1);
      setDisplayOrder(services.length + 1);
    }
    setModalOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!editingService) {
      const autoSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(autoSlug);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds 10MB limit', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.post<{ success: boolean; url: string }>('/api/media/upload', {
          filename: file.name,
          data: base64Data,
          category: 'services',
        });
        if (res.success && res.url) {
          setImageUrl(res.url);
          showToast('Service image uploaded successfully', 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'Image upload failed', 'error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a service title', 'error');
      return;
    }

    const finalSlug = (
      slug.trim() ||
      title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
    ).replace(/(^-|-$)/g, '');
    if (!finalSlug) {
      showToast('Valid slug identifier is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        icon: (icon || 'car').trim(),
        image_url: imageUrl.trim(),
        is_active: isActive,
        display_order: Number(displayOrder) || 0,
      };

      if (editingService) {
        await api.put(`/api/services/${editingService.id}`, payload);
        showToast(`Service "${title}" updated successfully`, 'success');
      } else {
        await api.post('/api/services', payload);
        showToast(`Service "${title}" created successfully`, 'success');
      }

      setModalOpen(false);
      loadServices();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const newStatus = service.is_active === 1 ? 0 : 1;
      await api.put(`/api/services/${service.id}`, {
        is_active: newStatus,
      });
      showToast(
        `Service "${service.title}" is now ${newStatus === 1 ? 'Active' : 'Inactive'}`,
        'success'
      );
      loadServices();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle service status', 'error');
    }
  };

  const confirmDelete = (service: Service) => {
    setServiceToDelete(service);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/services/${serviceToDelete.id}`);
      showToast(`Service "${serviceToDelete.title}" removed permanently`, 'success');
      setDeleteModalOpen(false);
      setServiceToDelete(null);
      loadServices();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete service', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.icon && s.icon.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.is_active === 1) ||
        (statusFilter === 'INACTIVE' && s.is_active === 0);

      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter]);

  const activeCount = services.filter(s => s.is_active === 1).length;
  const inactiveCount = services.filter(s => s.is_active === 0).length;

  return (
    <div>
      {/* Toast Feedback */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Banner & Stats */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
            }}
          >
            <Briefcase size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              Rental Services Management
            </h2>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
              Configure Pune-Mumbai cab services, airport shuttles, hourly packages, icons &
              ordering
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: '#94A3B8' }}>
              Total: <strong style={{ color: '#F8FAFC' }}>{services.length}</strong>
            </span>
            <span style={{ color: '#10B981' }}>
              Active: <strong>{activeCount}</strong>
            </span>
            <span style={{ color: '#F59E0B' }}>
              Inactive: <strong>{inactiveCount}</strong>
            </span>
          </div>

          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: '10px 18px',
              background: '#2563EB',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'background 0.2s',
            }}
          >
            <Plus size={18} />
            <span>Add Rental Service</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(tab => {
            const isTabActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: isTabActive ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isTabActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isTabActive ? '#93C5FD' : '#94A3B8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'ALL'
                  ? `All Services (${services.length})`
                  : tab === 'ACTIVE'
                    ? `Active (${activeCount})`
                    : `Inactive (${inactiveCount})`}
              </button>
            );
          })}
        </div>

        {/* Search Input & Refresh */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search services, title, slug..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '9px 12px 9px 36px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                minWidth: '260px',
              }}
            />
          </div>

          <button
            onClick={loadServices}
            title="Refresh Services"
            style={{
              padding: '9px 12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw
              size={16}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
            <RefreshCw
              size={32}
              style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }}
            />
            <div>Loading rental services...</div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Briefcase size={44} color="#475569" style={{ marginBottom: '14px' }} />
            <h4 style={{ margin: '0 0 8px 0', color: '#E2E8F0', fontSize: '1.1rem' }}>
              No rental services found
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem' }}>
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filter tags.'
                : 'Get started by creating your first rental service.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94A3B8',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '14px 20px' }}>Service & Identifier</th>
                  <th style={{ padding: '14px 16px' }}>Icon</th>
                  <th style={{ padding: '14px 16px' }}>Description Preview</th>
                  <th style={{ padding: '14px 16px' }}>Image</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Order</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Active Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s, idx) => {
                  const isLive = s.is_active === 1;
                  return (
                    <tr
                      key={s.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s',
                      }}
                    >
                      {/* Service & Title */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: 'rgba(59, 130, 246, 0.12)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {renderServiceIcon(s.icon, 20)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: '#F8FAFC',
                                fontSize: '0.95rem',
                                marginBottom: '4px',
                              }}
                            >
                              {s.title}
                            </div>
                            <div
                              style={{
                                display: 'inline-block',
                                color: '#64748B',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                background: 'rgba(15, 23, 42, 0.5)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              /{s.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Icon Key */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            color: '#93C5FD',
                            fontFamily: 'monospace',
                          }}
                        >
                          {s.icon || 'car'}
                        </span>
                      </td>

                      {/* Description Preview */}
                      <td
                        style={{
                          padding: '16px',
                          verticalAlign: 'middle',
                          maxWidth: '280px',
                        }}
                      >
                        <div
                          style={{
                            color: '#94A3B8',
                            fontSize: '0.825rem',
                            lineHeight: 1.45,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                          title={s.description || s.short_desc}
                        >
                          {s.description || s.short_desc || 'No description provided.'}
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        {s.image_url ? (
                          <div
                            style={{
                              width: '44px',
                              height: '36px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              background: '#0F172A',
                            }}
                          >
                            <img
                              src={s.image_url}
                              alt={s.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <span style={{ color: '#475569', fontSize: '0.75rem' }}>None</span>
                        )}
                      </td>

                      {/* Order */}
                      <td
                        style={{
                          padding: '16px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#CBD5E1',
                          }}
                        >
                          #{s.display_order ?? 0}
                        </span>
                      </td>

                      {/* Active Status Toggle */}
                      <td
                        style={{
                          padding: '16px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                        }}
                      >
                        <button
                          onClick={() => handleToggleActive(s)}
                          title={`Click to switch to ${isLive ? 'Inactive' : 'Active'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: isLive
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(148, 163, 184, 0.2)',
                            background: isLive
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(148, 163, 184, 0.08)',
                            color: isLive ? '#34D399' : '#94A3B8',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isLive ? <CheckCircle2 size={13} /> : <EyeOff size={13} />}
                          <span>{isLive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: '16px 20px',
                          verticalAlign: 'middle',
                          textAlign: 'right',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            onClick={() => handleOpenModal(s)}
                            title="Edit Service"
                            style={{
                              padding: '7px 10px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              borderRadius: '7px',
                              color: '#93C5FD',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              transition: 'background 0.2s',
                            }}
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => confirmDelete(s)}
                            title="Delete Service"
                            style={{
                              padding: '7px 10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '7px',
                              color: '#FCA5A5',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              transition: 'background 0.2s',
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? `Edit Service: ${editingService.title}` : 'Add New Rental Service'}
        maxWidth="680px"
      >
        <form
          onSubmit={handleSave}
          style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
        >
          {/* Title & Slug */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Service Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Pune to Mumbai One Way Cab"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="e.g. pune-mumbai-oneway"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#60A5FA',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                color: '#CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Service Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what makes this service unique, route details, vehicle options, toll coverage..."
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Visual Icon Selector */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label
                style={{
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Service Icon Selector
              </label>
              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                Selected:{' '}
                <strong style={{ color: '#60A5FA', fontFamily: 'monospace' }}>
                  {icon || 'car'}
                </strong>
              </span>
            </div>

            {/* Presets Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '10px',
              }}
            >
              {PRESET_ICONS.map(preset => {
                const IconComponent = preset.icon;
                const isSelected = icon.toLowerCase() === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setIcon(preset.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1.5px solid #3B82F6'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.22)' : 'rgba(15, 23, 42, 0.6)',
                      color: isSelected ? '#93C5FD' : '#94A3B8',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IconComponent size={18} color={isSelected ? '#60A5FA' : '#94A3B8'} />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Icon key input & live preview box */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {renderServiceIcon(icon, 20)}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={icon}
                  onChange={e => setIcon(e.target.value.toLowerCase().trim())}
                  placeholder="Or type custom key / emoji (e.g. plane, route, 🚗)"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Image URL & File Upload */}
          <div>
            <label
              style={{
                display: 'block',
                color: '#CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Service Image / Banner (Optional)
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://... or upload local image"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <label
                style={{
                  padding: '9px 14px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#93C5FD',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <Upload size={15} />
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
              </label>

              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  title="Remove image"
                  style={{
                    padding: '9px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    color: '#FCA5A5',
                    cursor: 'pointer',
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {imageUrl && (
              <div
                style={{
                  marginTop: '10px',
                  width: '120px',
                  height: '70px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: '#0F172A',
                }}
              >
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          {/* Display Order & Active Toggle */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              alignItems: 'center',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                Display Order
              </label>
              <input
                type="number"
                min={0}
                value={displayOrder}
                onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  marginTop: '2px',
                  display: 'block',
                }}
              >
                Lower numbers display first
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Visibility
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive === 1}
                  onChange={e => setIsActive(e.target.checked ? 1 : 0)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#3B82F6',
                    cursor: 'pointer',
                  }}
                />
                <span
                  style={{
                    color: isActive === 1 ? '#34D399' : '#94A3B8',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {isActive === 1 ? 'Active (Live on Website)' : 'Inactive (Hidden)'}
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '8px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: '9px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '9px 22px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              {isSaving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Permanent Deletion"
        maxWidth="480px"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h4 style={{ margin: '0 0 10px 0', color: '#F8FAFC', fontSize: '1.15rem' }}>
            Delete &quot;{serviceToDelete?.title}&quot;?
          </h4>
          <p
            style={{
              margin: '0 0 20px 0',
              color: '#94A3B8',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete this rental service? This action will remove it from the
            homepage, booking form route list, and cannot be undone.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
              style={{
                padding: '9px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '9px 22px',
                background: '#DC2626',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
