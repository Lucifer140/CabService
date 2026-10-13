import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { BlogPost } from '../../../types';
import { Modal } from '../../shared/Modal';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  FileText,
  Sparkles,
  TrendingUp,
  Tag,
  AlertCircle,
} from 'lucide-react';

export const BlogView: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Route Guide');
  const [author, setAuthor] = useState('Sangita Travels Editorial');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [isPublished, setIsPublished] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; posts: BlogPost[] }>('/api/admin/blog');
      if (res.success) {
        setPosts(res.posts || []);
      }
    } catch (err) {
      console.error('Failed to load blog posts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (p?: BlogPost) => {
    setFormError('');
    if (p) {
      setEditingPost(p);
      setTitle(p.title);
      setSlug(p.slug);
      setCategory(p.category || 'Route Guide');
      setAuthor(p.author || 'Sangita Travels Editorial');
      setFeaturedImage(p.featured_image || '');
      setTags(p.tags || '');
      setExcerpt(p.excerpt || '');
      setContentHtml(p.content_html || '');
      setIsPublished(p.is_published);
    } else {
      setEditingPost(null);
      setTitle('');
      setSlug('');
      setCategory('Route Guide');
      setAuthor('Sangita Travels Editorial');
      setFeaturedImage('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80');
      setTags('pune, mumbai, cab');
      setExcerpt('');
      setContentHtml('<p>Write article content here...</p>');
      setIsPublished(1);
    }
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPost) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Article title is required.');
      return;
    }
    if (!contentHtml.trim()) {
      setFormError('Article content HTML is required.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        category: category.trim(),
        author: author.trim(),
        featured_image: featuredImage.trim(),
        tags: tags.trim(),
        excerpt: excerpt.trim(),
        content_html: contentHtml.trim(),
        is_published: isPublished,
      };

      if (editingPost) {
        await api.put(`/api/blog/${editingPost.id}`, payload);
      } else {
        await api.post('/api/blog', payload);
      }

      setModalOpen(false);
      loadPosts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/blog/${id}`);
      setDeleteConfirmId(null);
      loadPosts();
    } catch (err) {
      console.error('Failed to delete blog post', err);
    }
  };

  const handleTogglePublish = async (p: BlogPost) => {
    try {
      const nextStatus = p.is_published ? 0 : 1;
      await api.put(`/api/blog/${p.id}`, {
        title: p.title,
        slug: p.slug,
        is_published: nextStatus,
      });
      loadPosts();
    } catch (err) {
      console.error('Failed to toggle article status', err);
    }
  };

  // KPIs
  const totalArticles = posts.length;
  const publishedArticles = posts.filter(p => p.is_published).length;
  const totalViews = posts.reduce((acc, p) => acc + (p.views_count || 0), 0);

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter(p => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ padding: '24px 32px', color: '#F8FAFC', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="#3B82F6" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Blog & Content Marketing Engine
            </h1>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Publish SEO-rich travel guides, Pune-Mumbai highway tips, and rank high on Google search.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
          }}
        >
          <Plus size={18} /> New Article
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>Total Articles</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC' }}>{totalArticles}</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>Published Live</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>{publishedArticles}</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>Total Organic Views</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60A5FA' }}>{totalViews.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '14px 18px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search articles by title, slug, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#F8FAFC',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              background: 'rgba(10, 15, 29, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#60A5FA' }}>Loading articles...</div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
            No articles match your criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(10, 15, 29, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '14px 18px', color: '#94A3B8', fontWeight: 600 }}>Article</th>
                  <th style={{ padding: '14px 18px', color: '#94A3B8', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '14px 18px', color: '#94A3B8', fontWeight: 600 }}>Author</th>
                  <th style={{ padding: '14px 18px', color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>Views</th>
                  <th style={{ padding: '14px 18px', color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 18px', color: '#94A3B8', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr
                    key={post.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Article title & thumbnail */}
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt=""
                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              background: '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FileText size={20} color="#64748B" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#F8FAFC', marginBottom: '2px' }}>
                            {post.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            /{post.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '16px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          color: '#60A5FA',
                          fontWeight: 600,
                        }}
                      >
                        {post.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td style={{ padding: '16px 18px', color: '#CBD5E1' }}>
                      {post.author}
                    </td>

                    {/* Views */}
                    <td style={{ padding: '16px 18px', textAlign: 'center', fontWeight: 600, color: '#10B981' }}>
                      {post.views_count || 0}
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleTogglePublish(post)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          background: post.is_published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                          color: post.is_published ? '#34D399' : '#94A3B8',
                        }}
                      >
                        {post.is_published ? '● Published' : '○ Draft'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={`#/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on site"
                          style={{
                            padding: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            color: '#94A3B8',
                            display: 'inline-flex',
                          }}
                        >
                          <ExternalLink size={15} />
                        </a>
                        <button
                          onClick={() => handleOpenModal(post)}
                          title="Edit article"
                          style={{
                            padding: '6px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#60A5FA',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(post.id)}
                          title="Delete article"
                          style={{
                            padding: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#F87171',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Article Confirmation"
        >
          <div style={{ color: '#E2E8F0', padding: '10px 0' }}>
            <p style={{ margin: '0 0 20px 0', lineHeight: 1.6 }}>
              Are you sure you want to permanently delete this article? This action cannot be undone and may impact SEO backlinks.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  padding: '8px 18px',
                  background: '#EF4444',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Delete Article
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Article Modal */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingPost ? 'Edit Blog Article' : 'Create New Article'}
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#E2E8F0' }}>
            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  color: '#F87171',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                Article Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Complete Guide to Pune Mumbai Cab Travel"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Slug & Category Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="pune-mumbai-cab-guide"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#60A5FA',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Route Guide">Route Guide</option>
                  <option value="Travel Tips">Travel Tips</option>
                  <option value="Tourist Places">Tourist Places</option>
                  <option value="Pune-Mumbai Route">Pune-Mumbai Route</option>
                  <option value="Airport Transfer">Airport Transfer</option>
                </select>
              </div>
            </div>

            {/* Author & Tags */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="pune, mumbai, airport, taxi"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Featured Image URL */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                Featured Image URL
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={e => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Excerpt */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                Excerpt / SEO Meta Summary
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Short summary displayed on search results and card previews..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Content HTML */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '6px' }}>
                Article Content (HTML) *
              </label>
              <textarea
                rows={8}
                required
                value={contentHtml}
                onChange={e => setContentHtml(e.target.value)}
                placeholder="<p>Write your article here...</p><h3>Section Heading</h3>"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(10, 15, 29, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Published Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="is_published"
                checked={isPublished === 1}
                onChange={e => setIsPublished(e.target.checked ? 1 : 0)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="is_published" style={{ fontSize: '0.88rem', color: '#E2E8F0', cursor: 'pointer' }}>
                Publish Article Immediately (Visible to Customers & Google)
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  background: '#2563EB',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                }}
              >
                {saving ? 'Saving...' : editingPost ? 'Update Article' : 'Publish Article'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
