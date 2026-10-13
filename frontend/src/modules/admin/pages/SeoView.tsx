import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../services/api';
import { SeoMeta } from '../../../types';
import { Toast } from '../../shared/Toast';
import { Modal } from '../../shared/Modal';
import {
  Search,
  Globe,
  Share2,
  Check,
  RefreshCw,
  Upload,
  Plus,
  Monitor,
  Smartphone,
  X,
} from 'lucide-react';

// Recommended standard pages
const DEFAULT_PAGE_KEYS = [
  { key: 'home', label: 'Home Page', path: '/' },
  { key: 'fleet', label: 'Vehicle Fleet', path: '/#about' },
  { key: 'tours', label: 'Tour Packages', path: '/#service' },
  { key: 'services', label: 'Rental Services', path: '/#services' },
  { key: 'about', label: 'About Us', path: '/#about' },
  { key: 'contact', label: 'Contact & Booking', path: '/#booking' },
];

export const SeoView: React.FC = () => {
  const [seoList, setSeoList] = useState<SeoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>('home');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Active Editor Form Fields
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Preview Mode
  const [previewTab, setPreviewTab] = useState<'google' | 'social'>('google');
  const [googleDevice, setGoogleDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Add Page Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPageKey, setNewPageKey] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const populateForm = (key: string, list: SeoMeta[]) => {
    const item = list.find(s => (s.page_key || s.page_identifier) === key);
    if (item) {
      setTitle(item.title || '');
      setMetaDescription(item.meta_description || '');
      setKeywords(item.keywords || '');
      setCanonicalUrl(
        item.canonical_url || `https://sangitatravelspune.com/${key === 'home' ? '' : key}`
      );
      setOgTitle(item.og_title || item.title || '');
      setOgDescription(item.og_description || item.meta_description || '');
      setOgImage(item.og_image || '');
    } else {
      setTitle(`Sangita Travels Pune — ${key.charAt(0).toUpperCase() + key.slice(1)}`);
      setMetaDescription(
        'Book reliable 24x7 Pune to Mumbai cabs, airport transfers & Maharashtra tour packages.'
      );
      setKeywords('pune mumbai cab, taxi pune mumbai, sangita travels');
      setCanonicalUrl(`https://sangitatravelspune.com/${key === 'home' ? '' : key}`);
      setOgTitle(`Sangita Travels Pune — ${key.charAt(0).toUpperCase() + key.slice(1)}`);
      setOgDescription(
        'Book reliable 24x7 Pune to Mumbai cabs, airport transfers & Maharashtra tour packages.'
      );
      setOgImage('');
    }
  };

  const loadSeoData = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; seo: SeoMeta[] }>('/api/seo');
      if (res.success) {
        const list = res.seo || [];
        setSeoList(list);
        populateForm(selectedKey, list);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load SEO metadata', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get<{ success: boolean; seo: SeoMeta[] }>('/api/seo')
      .then(res => {
        if (!active) return;
        if (res.success) {
          const list = res.seo || [];
          setSeoList(list);
          populateForm('home', list);
        }
      })
      .catch((err: any) => {
        if (active) {
          showToast(err.message || 'Failed to load SEO metadata', 'error');
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

  const handleSelectPage = (key: string) => {
    setSelectedKey(key);
    populateForm(key, seoList);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Meta title is required for Google indexing', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: SeoMeta = {
        page_key: selectedKey,
        page_identifier: selectedKey,
        title: title.trim(),
        meta_description: metaDescription.trim(),
        keywords: keywords.trim(),
        canonical_url: canonicalUrl.trim(),
        og_title: ogTitle.trim() || title.trim(),
        og_description: ogDescription.trim() || metaDescription.trim(),
        og_image: ogImage.trim(),
      };

      await api.post('/api/seo', payload);
      showToast(`SEO settings for "${selectedKey}" saved successfully!`, 'success');

      // Update local state
      setSeoList(prev => {
        const idx = prev.findIndex(s => (s.page_key || s.page_identifier) === selectedKey);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...payload, updated_at: new Date().toISOString() };
          return updated;
        } else {
          return [...prev, { ...payload, updated_at: new Date().toISOString() }];
        }
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to save SEO metadata', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit', 'error');
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
          category: 'seo',
        });
        if (res.success && res.url) {
          setOgImage(res.url);
          showToast('OG social image uploaded successfully', 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to upload image', 'error');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newPageKey
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .trim();
    if (!cleanKey) {
      showToast('Valid page key slug is required', 'error');
      return;
    }

    const defaultTitle = newPageTitle.trim() || `Sangita Travels — ${cleanKey}`;
    const newEntry: SeoMeta = {
      page_key: cleanKey,
      page_identifier: cleanKey,
      title: defaultTitle,
      meta_description:
        'Book 24x7 comfortable AC cab services from Pune to Mumbai with Sangita Travels.',
      keywords: `${cleanKey} cab, pune taxi`,
      canonical_url: `https://sangitatravelspune.com/${cleanKey}`,
      og_title: defaultTitle,
      og_description:
        'Book 24x7 comfortable AC cab services from Pune to Mumbai with Sangita Travels.',
      og_image: '',
    };

    setSeoList(prev => [...prev, newEntry]);
    setSelectedKey(cleanKey);
    setTitle(newEntry.title);
    setMetaDescription(newEntry.meta_description);
    setKeywords(newEntry.keywords || '');
    setCanonicalUrl(newEntry.canonical_url || '');
    setOgTitle(newEntry.og_title || '');
    setOgDescription(newEntry.og_description || '');
    setOgImage('');
    setAddModalOpen(false);
    setNewPageKey('');
    setNewPageTitle('');
    showToast(`Added page "${cleanKey}". Remember to save your settings!`, 'info');
  };

  // Combine default pages with any custom pages already in database
  const allManagedPages = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    DEFAULT_PAGE_KEYS.forEach(p => map.set(p.key, { key: p.key, label: p.label }));
    seoList.forEach(s => {
      const k = (s.page_key || s.page_identifier || '').toLowerCase();
      if (k && !map.has(k)) {
        map.set(k, { key: k, label: k.charAt(0).toUpperCase() + k.slice(1) });
      }
    });
    return Array.from(map.values());
  }, [seoList]);

  // Length Evaluation Helpers
  const titleLen = title.length;
  const descLen = metaDescription.length;

  const getTitleStatus = () => {
    if (titleLen === 0)
      return { label: 'Missing', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (titleLen < 30) return { label: 'Short', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    if (titleLen <= 60)
      return { label: 'Optimal', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    return { label: 'Too Long (>60)', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  const getDescStatus = () => {
    if (descLen === 0) return { label: 'Missing', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (descLen < 70) return { label: 'Short', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    if (descLen <= 160)
      return { label: 'Optimal', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    return { label: 'Too Long (>160)', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  return (
    <div>
      {/* Toast Feedback */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Banner & Header */}
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
            <Search size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              SEO & Social Meta Management
            </h2>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
              Optimize Google Search snippets, Open Graph cards, canonical URLs & target keywords
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
              Managed Pages: <strong style={{ color: '#F8FAFC' }}>{allManagedPages.length}</strong>
            </span>
            <span style={{ color: '#10B981' }}>
              Active in DB: <strong>{seoList.length}</strong>
            </span>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
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
            <span>Add Custom Page</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Page Selector + Editor & Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Page Selector Sidebar */}
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94A3B8',
                fontWeight: 700,
              }}
            >
              Select Page
            </span>
            <button
              onClick={loadSeoData}
              title="Refresh"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <RefreshCw
                size={14}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
          </div>

          {allManagedPages.map(page => {
            const isSelected = selectedKey === page.key;
            const existing = seoList.find(s => (s.page_key || s.page_identifier) === page.key);
            const isConfigured = Boolean(existing && existing.title);

            return (
              <button
                key={page.key}
                type="button"
                onClick={() => handleSelectPage(page.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isSelected
                    ? '1.5px solid #3B82F6'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'rgba(15, 23, 42, 0.4)',
                  color: isSelected ? '#93C5FD' : '#E2E8F0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontWeight: isSelected ? 700 : 600, fontSize: '0.9rem' }}>
                    {page.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: isSelected ? '#60A5FA' : '#64748B',
                      fontFamily: 'monospace',
                      marginTop: '2px',
                    }}
                  >
                    /{page.key}
                  </div>
                </div>

                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isConfigured ? '#10B981' : '#F59E0B',
                    boxShadow: isConfigured
                      ? '0 0 8px rgba(16, 185, 129, 0.6)'
                      : '0 0 8px rgba(245, 158, 11, 0.6)',
                  }}
                  title={isConfigured ? 'Configured in DB' : 'Using defaults'}
                />
              </button>
            );
          })}
        </div>

        {/* Editor & Previews Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* LIVE SEARCH & SOCIAL PREVIEW CARD */}
          <div
            style={{
              background: '#131B2E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px 24px',
            }}
          >
            {/* Preview Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewTab('google')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border:
                      previewTab === 'google'
                        ? '1px solid #3B82F6'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    background:
                      previewTab === 'google'
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                    color: previewTab === 'google' ? '#93C5FD' : '#94A3B8',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Globe size={15} />
                  <span>Google Search SERP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('social')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border:
                      previewTab === 'social'
                        ? '1px solid #3B82F6'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    background:
                      previewTab === 'social'
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                    color: previewTab === 'social' ? '#93C5FD' : '#94A3B8',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Share2 size={15} />
                  <span>Social Share (Open Graph)</span>
                </button>
              </div>

              {previewTab === 'google' && (
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '3px',
                    borderRadius: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setGoogleDevice('desktop')}
                    style={{
                      padding: '4px 10px',
                      background:
                        googleDevice === 'desktop' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: googleDevice === 'desktop' ? '#93C5FD' : '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Monitor size={13} />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleDevice('mobile')}
                    style={{
                      padding: '4px 10px',
                      background:
                        googleDevice === 'mobile' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: googleDevice === 'mobile' ? '#93C5FD' : '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Smartphone size={13} />
                    <span>Mobile</span>
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW CONTAINER */}
            {previewTab === 'google' ? (
              /* GOOGLE SEARCH SNIPPET SIMULATOR */
              <div
                style={{
                  background: '#202124',
                  borderRadius: '12px',
                  padding: googleDevice === 'desktop' ? '18px 22px' : '14px 16px',
                  maxWidth: googleDevice === 'desktop' ? '600px' : '380px',
                  border: '1px solid #3c4043',
                  fontFamily: 'arial, sans-serif',
                }}
              >
                {/* Site breadcrumb & favicon */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#303134',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: '#8ab4f8',
                      fontWeight: 700,
                    }}
                  >
                    🚕
                  </div>
                  <div>
                    <div style={{ color: '#dadce0', fontSize: '13px', lineHeight: 1.2 }}>
                      Sangita Travels Pune
                    </div>
                    <div style={{ color: '#bdc1c6', fontSize: '11px', lineHeight: 1.2 }}>
                      {canonicalUrl ||
                        `https://sangitatravelspune.com/${selectedKey === 'home' ? '' : selectedKey}`}
                    </div>
                  </div>
                </div>

                {/* Blue Clickable Title */}
                <h3
                  style={{
                    margin: '6px 0 4px 0',
                    color: '#8ab4f8',
                    fontSize: googleDevice === 'desktop' ? '18px' : '16px',
                    fontWeight: 400,
                    lineHeight: 1.3,
                    cursor: 'pointer',
                    wordBreak: 'break-word',
                  }}
                >
                  {title || 'Sangita Travels Pune | Pune to Mumbai Cab Service'}
                </h3>

                {/* Description Snippet */}
                <div
                  style={{
                    color: '#bdc1c6',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {metaDescription ||
                    'Book affordable & sanitized cabs between Pune and Mumbai. Dedicated 24x7 one-way transfers, airport drop, hourly rentals & Maharashtra tour packages.'}
                </div>
              </div>
            ) : (
              /* SOCIAL SHARE (OPEN GRAPH) SIMULATOR */
              <div
                style={{
                  background: '#0F172A',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  maxWidth: '500px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
                }}
              >
                {ogImage ? (
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      overflow: 'hidden',
                      background: '#0B1120',
                    }}
                  >
                    <img
                      src={ogImage}
                      alt="Social Share Card"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '140px',
                      background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#64748B',
                    }}
                  >
                    <Share2 size={28} />
                    <span style={{ fontSize: '0.8rem' }}>
                      No OG Image specified (Using default fallback)
                    </span>
                  </div>
                )}

                <div style={{ padding: '14px 16px', background: '#131B2E' }}>
                  <div
                    style={{
                      color: '#94A3B8',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '4px',
                    }}
                  >
                    sangitatravelspune.com
                  </div>
                  <div
                    style={{
                      color: '#F8FAFC',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      marginBottom: '6px',
                      lineHeight: 1.3,
                    }}
                  >
                    {ogTitle || title || 'Sangita Travels Pune'}
                  </div>
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
                  >
                    {ogDescription ||
                      metaDescription ||
                      'Book lowest fare cabs between Pune and Mumbai.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* EDIT FORM */}
          <form
            onSubmit={handleSave}
            style={{
              background: '#131B2E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC' }}>
                  Editing SEO: &quot;{selectedKey}&quot;
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  All updates immediately synchronize with Google crawler metadata & website headers
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '9px 24px',
                  background: '#2563EB',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                <Check size={16} />
                <span>{isSaving ? 'Saving...' : 'Save SEO Settings'}</span>
              </button>
            </div>

            {/* Page Identifier & Canonical URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
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
                  Page Key Identifier
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedKey}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#60A5FA',
                    fontFamily: 'monospace',
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
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={e => setCanonicalUrl(e.target.value)}
                  placeholder="https://sangitatravelspune.com/"
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
            </div>

            {/* Title with Live Counter */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    color: '#CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Meta Title * (Target: ≤60 characters)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: titleStatus.bg,
                      color: titleStatus.color,
                    }}
                  >
                    {titleStatus.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: titleLen > 60 ? '#EF4444' : '#60A5FA',
                    }}
                  >
                    {titleLen} / 60
                  </span>
                </div>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Pune to Mumbai Cab Service | Sangita Travels Pune"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: `1px solid ${titleLen > 60 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              {/* Progress indicator bar */}
              <div
                style={{
                  height: '3px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '2px',
                  marginTop: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (titleLen / 60) * 100)}%`,
                    background: titleLen > 60 ? '#EF4444' : titleLen >= 30 ? '#10B981' : '#F59E0B',
                    transition: 'width 0.2s, background 0.2s',
                  }}
                />
              </div>
            </div>

            {/* Meta Description with Live Counter */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    color: '#CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Meta Description (Target: ≤160 characters)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: descStatus.bg,
                      color: descStatus.color,
                    }}
                  >
                    {descStatus.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: descLen > 160 ? '#EF4444' : '#60A5FA',
                    }}
                  >
                    {descLen} / 160
                  </span>
                </div>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                placeholder="Write compelling summary with primary search terms and call-to-action for travelers..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: `1px solid ${descLen > 160 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
              {/* Progress indicator bar */}
              <div
                style={{
                  height: '3px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '2px',
                  marginTop: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (descLen / 160) * 100)}%`,
                    background: descLen > 160 ? '#EF4444' : descLen >= 70 ? '#10B981' : '#F59E0B',
                    transition: 'width 0.2s, background 0.2s',
                  }}
                />
              </div>
            </div>

            {/* Target Keywords */}
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
                Focus Keywords (Comma Separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="pune to mumbai cab, outstation taxi pune, shirdi cab package, sangita travels"
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

            {/* Social Share & Open Graph Section */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Share2 size={16} color="#60A5FA" />
                  <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem' }}>
                    Open Graph & Social Sharing Card
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setOgTitle(title)}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#CBD5E1',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Copy Title
                  </button>
                  <button
                    type="button"
                    onClick={() => setOgDescription(metaDescription)}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#CBD5E1',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Copy Description
                  </button>
                </div>
              </div>

              {/* OG Title & Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#94A3B8',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    OG Social Title
                  </label>
                  <input
                    type="text"
                    value={ogTitle}
                    onChange={e => setOgTitle(e.target.value)}
                    placeholder="Defaults to meta title if blank"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.825rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#94A3B8',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    OG Social Description
                  </label>
                  <input
                    type="text"
                    value={ogDescription}
                    onChange={e => setOgDescription(e.target.value)}
                    placeholder="Defaults to meta description if blank"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.825rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* OG Image */}
              <div>
                <label
                  style={{
                    display: 'block',
                    color: '#94A3B8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  OG Featured Banner Image URL (1200 × 630px recommended)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={ogImage}
                    onChange={e => setOgImage(e.target.value)}
                    placeholder="https://... or upload local banner"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.825rem',
                      boxSizing: 'border-box',
                    }}
                  />

                  <label
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      color: '#93C5FD',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Upload size={14} />
                    <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {ogImage && (
                    <button
                      type="button"
                      onClick={() => setOgImage('')}
                      style={{
                        padding: '8px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '6px',
                        color: '#FCA5A5',
                        cursor: 'pointer',
                      }}
                      title="Remove Image"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ADD CUSTOM PAGE MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Custom Page SEO Tagging"
        maxWidth="480px"
      >
        <form
          onSubmit={handleAddPage}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
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
              Page Slug Identifier *
            </label>
            <input
              type="text"
              required
              value={newPageKey}
              onChange={e => setNewPageKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. shirdi-cab, airport-taxi, terms"
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
              Default Meta Title
            </label>
            <input
              type="text"
              value={newPageTitle}
              onChange={e => setNewPageTitle(e.target.value)}
              placeholder="e.g. Shirdi Darshan Cab Package | Sangita Travels"
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

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}
          >
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              style={{
                padding: '8px 16px',
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
              style={{
                padding: '8px 20px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              Create Page SEO
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
