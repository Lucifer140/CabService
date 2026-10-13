import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../services/api';
import { Tour } from '../../../types';
import { Modal } from '../../shared/Modal';
import { Toast } from '../../shared/Toast';
import {
  Compass,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  EyeOff,
  Clock,
  MapPin,
  Upload,
  AlertTriangle,
  RefreshCw,
  Check,
} from 'lucide-react';

export const ToursView: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('1 Day');
  const [price, setPrice] = useState<string>('');
  const [itinerary, setItinerary] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublished, setIsPublished] = useState<number>(1);
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
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

  const loadTours = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; tours: Tour[] }>('/api/tours');
      if (res.success) {
        setTours(res.tours || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load tour packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get<{ success: boolean; tours: Tour[] }>('/api/tours')
      .then(res => {
        if (active && res.success) {
          setTours(res.tours || []);
        }
      })
      .catch((err: any) => {
        if (active) {
          showToast(err.message || 'Failed to load tour packages', 'error');
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

  const handleOpenModal = (tour?: Tour) => {
    if (tour) {
      setEditingTour(tour);
      setTitle(tour.title);
      setSlug(tour.slug);
      setDestination(tour.destination);
      setDuration(tour.duration || '1 Day');
      setPrice(tour.price !== null && tour.price !== undefined ? String(tour.price) : '');
      setItinerary(tour.itinerary || '');
      setInclusions(tour.inclusions || '');
      setExclusions(tour.exclusions || '');
      setCoverImage(tour.cover_image || tour.image_url || '');
      setIsPublished(tour.is_published !== undefined ? tour.is_published : 1);
      setDisplayOrder(tour.display_order !== undefined ? tour.display_order : 0);
    } else {
      setEditingTour(null);
      setTitle('');
      setSlug('');
      setDestination('');
      setDuration('1 Day');
      setPrice('');
      setItinerary('');
      setInclusions('Dedicated AC Cab, Fuel, Tolls & Parking, FastTag, Driver Allowance');
      setExclusions('Hotel accommodations, Meals, Monument Entry Fees, Personal expenses');
      setCoverImage('');
      setIsPublished(1);
      setDisplayOrder(tours.length + 1);
    }
    setModalOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!editingTour) {
      const autoSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(autoSlug);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          category: 'tours',
        });
        if (res.success && res.url) {
          setCoverImage(res.url);
          showToast('Cover image uploaded successfully', 'success');
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
      showToast('Tour title is required', 'error');
      return;
    }
    if (!destination.trim()) {
      showToast('Destination is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug:
          slug.trim() ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        destination: destination.trim(),
        duration: duration.trim(),
        price: price.trim() !== '' ? parseFloat(price) : null,
        itinerary: itinerary.trim(),
        inclusions: inclusions.trim(),
        exclusions: exclusions.trim(),
        cover_image: coverImage.trim(),
        is_published: isPublished,
        display_order: Number(displayOrder) || 0,
      };

      if (editingTour) {
        await api.put(`/api/tours/${editingTour.id}`, payload);
        showToast(`Tour package "${title}" updated successfully`, 'success');
      } else {
        await api.post('/api/tours', payload);
        showToast(`Tour package "${title}" created successfully`, 'success');
      }

      setModalOpen(false);
      loadTours();
    } catch (err: any) {
      showToast(err.message || 'Failed to save tour package', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (tour: Tour) => {
    try {
      const newStatus = tour.is_published === 1 ? 0 : 1;
      await api.put(`/api/tours/${tour.id}`, {
        is_published: newStatus,
      });
      showToast(
        `Tour "${tour.title}" is now ${newStatus === 1 ? 'Published' : 'Draft'}`,
        'success'
      );
      loadTours();
    } catch (err: any) {
      showToast(err.message || 'Failed to update tour status', 'error');
    }
  };

  const confirmDelete = (tour: Tour) => {
    setTourToDelete(tour);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!tourToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/tours/${tourToDelete.id}`);
      showToast(`Tour "${tourToDelete.title}" removed permanently`, 'success');
      setDeleteModalOpen(false);
      setTourToDelete(null);
      loadTours();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete tour package', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered tours
  const filteredTours = useMemo(() => {
    return tours.filter(t => {
      const matchesSearch =
        search.trim() === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.destination.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase()) ||
        (t.itinerary && t.itinerary.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && t.is_published === 1) ||
        (statusFilter === 'DRAFT' && t.is_published === 0);

      return matchesSearch && matchesStatus;
    });
  }, [tours, search, statusFilter]);

  const publishedCount = tours.filter(t => t.is_published === 1).length;
  const draftCount = tours.filter(t => t.is_published === 0).length;

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
            <Compass size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              Tour Packages Management
            </h2>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
              Curate outstation itineraries, holy yatras, sightseeing packages & starting pricing
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
              Total: <strong style={{ color: '#F8FAFC' }}>{tours.length}</strong>
            </span>
            <span style={{ color: '#10B981' }}>
              Live: <strong>{publishedCount}</strong>
            </span>
            <span style={{ color: '#F59E0B' }}>
              Drafts: <strong>{draftCount}</strong>
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
            <span>Add Tour Package</span>
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
          {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map(tab => {
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#93C5FD' : '#94A3B8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'ALL'
                  ? `All Tours (${tours.length})`
                  : tab === 'PUBLISHED'
                    ? `Live (${publishedCount})`
                    : `Drafts (${draftCount})`}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search tours, destination, slug..."
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
            onClick={loadTours}
            title="Refresh Tours"
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
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tours Table */}
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
            <div>Loading tour packages...</div>
          </div>
        ) : filteredTours.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Compass size={44} color="#475569" style={{ marginBottom: '14px' }} />
            <h4 style={{ margin: '0 0 8px 0', color: '#E2E8F0', fontSize: '1.1rem' }}>
              No tour packages found
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem' }}>
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filter tags.'
                : 'Get started by creating your first featured tour package.'}
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
                  <th style={{ padding: '14px 20px' }}>Tour Package</th>
                  <th style={{ padding: '14px 16px' }}>Destination</th>
                  <th style={{ padding: '14px 16px' }}>Duration & Price</th>
                  <th style={{ padding: '14px 16px' }}>Itinerary Preview</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Order</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTours.map((t, idx) => {
                  const isLive = t.is_published === 1;
                  const imgSrc = t.cover_image || t.image_url;
                  return (
                    <tr
                      key={t.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Tour Package Info */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              background: '#1E293B',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {imgSrc ? (
                              <img
                                src={imgSrc.startsWith('http') ? imgSrc : `/${imgSrc}`}
                                alt={t.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => {
                                  // Fallback on broken image
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Compass size={22} color="#64748B" />
                            )}
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
                              {t.title}
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
                              /{t.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            color: '#93C5FD',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          <MapPin size={13} />
                          {t.destination}
                        </span>
                      </td>

                      {/* Duration & Price */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: '#CBD5E1',
                            fontSize: '0.85rem',
                            marginBottom: '4px',
                          }}
                        >
                          <Clock size={14} color="#94A3B8" />
                          <span>{t.duration || '1 Day'}</span>
                        </div>
                        <div style={{ fontWeight: 800, color: '#34D399', fontSize: '0.95rem' }}>
                          {t.price !== null && t.price !== undefined && t.price > 0 ? (
                            `₹${Number(t.price).toLocaleString('en-IN')}`
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 500 }}>
                              Custom Quote
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Itinerary Preview */}
                      <td
                        style={{
                          padding: '16px',
                          verticalAlign: 'middle',
                          maxWidth: '260px',
                        }}
                      >
                        <div
                          style={{
                            color: '#94A3B8',
                            fontSize: '0.8rem',
                            lineHeight: 1.45,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                          title={t.itinerary}
                        >
                          {t.itinerary || 'No itinerary detailed yet.'}
                        </div>
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
                          #{t.display_order ?? 0}
                        </span>
                      </td>

                      {/* Status / Publish Toggle */}
                      <td
                        style={{
                          padding: '16px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                        }}
                      >
                        <button
                          onClick={() => handleTogglePublish(t)}
                          title={`Click to ${isLive ? 'Unpublish' : 'Publish'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            background: isLive
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                            color: isLive ? '#34D399' : '#FBBF24',
                            transition: 'transform 0.1s',
                          }}
                        >
                          {isLive ? <CheckCircle2 size={13} /> : <EyeOff size={13} />}
                          <span>{isLive ? 'LIVE' : 'DRAFT'}</span>
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
                            onClick={() => handleOpenModal(t)}
                            title="Edit Tour Package"
                            style={{
                              padding: '7px 10px',
                              background: 'rgba(59, 130, 246, 0.12)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              borderRadius: '8px',
                              color: '#60A5FA',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => confirmDelete(t)}
                            title="Delete Tour Package"
                            style={{
                              padding: '7px 10px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '8px',
                              color: '#F87171',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={14} />
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

      {/* CREATE / EDIT TOUR MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTour ? `Edit Tour: ${editingTour.title}` : 'Create New Tour Package'}
        maxWidth="680px"
      >
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title & Slug */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  Tour Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar & Panchgani Holiday"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mahabaleshwar-panchgani"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Destination, Duration, Price */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  Destination *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahabaleshwar"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Days / 1 Night"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  Package Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Blank for custom"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Display Order & Published Toggle */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={e => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ paddingTop: '18px' }}>
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
                    checked={isPublished === 1}
                    onChange={e => setIsPublished(e.target.checked ? 1 : 0)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem' }}>
                      Publish Immediately
                    </span>
                    <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                      Show on public website tour catalog
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Cover Image URL & Direct Upload */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: '#94A3B8',
                }}
              >
                Cover Image Asset
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="e.g. assets/images/tours/mahabaleshwar.jpg"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />

                <label
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#60A5FA',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Upload size={15} />
                  <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {coverImage && (
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '8px',
                  }}
                >
                  <img
                    src={coverImage.startsWith('http') ? coverImage : `/${coverImage}`}
                    alt="Cover preview"
                    style={{
                      width: '60px',
                      height: '40px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', wordBreak: 'break-all' }}>
                    {coverImage}
                  </span>
                </div>
              )}
            </div>

            {/* Itinerary Textarea */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: '#94A3B8',
                }}
              >
                Day-by-Day Itinerary *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Day 1: Pickup from Pune -> Highway Expressway -> Hotel Check-in -> Table Land sightseeing.&#10;Day 2: Venna Lake boating -> Arthur Seat viewpoint -> Return drive to Pune."
                value={itinerary}
                onChange={e => setItinerary(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Inclusions & Exclusions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  Package Inclusions
                </label>
                <textarea
                  rows={2}
                  placeholder="Dedicated AC Cab, Fuel, Tolls & Parking, Driver Allowance"
                  value={inclusions}
                  onChange={e => setInclusions(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: '#94A3B8',
                  }}
                >
                  Package Exclusions
                </label>
                <textarea
                  rows={2}
                  placeholder="Hotels, Meals, Monument Entry tickets, Personal Puja expenses"
                  value={exclusions}
                  onChange={e => setExclusions(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '10px 22px',
                  background: '#2563EB',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{editingTour ? 'Update Tour Package' : 'Publish Tour Package'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Tour Deletion"
        maxWidth="460px"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <AlertTriangle size={30} />
          </div>

          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#F8FAFC' }}>
            Delete Tour Package?
          </h4>

          <p
            style={{
              color: '#94A3B8',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              margin: '0 0 20px 0',
            }}
          >
            Are you sure you want to permanently remove{' '}
            <strong style={{ color: '#F8FAFC' }}>"{tourToDelete?.title}"</strong>? This will
            immediately remove it from public website listings.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '10px 22px',
                background: '#DC2626',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Tour'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
