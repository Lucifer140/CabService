import React, { useState, useEffect } from 'react';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import {
  Clock,
  Eye,
  User,
  Calendar,
  ArrowLeft,
  Share2,
  Check,
  MessageCircle,
  Phone,
  Compass,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface BlogPostDetail {
  id: number;
  title: string;
  slug: string;
  content_html: string;
  excerpt: string;
  featured_image: string;
  author: string;
  category: string;
  tags: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  category: string;
  views_count: number;
}

interface BlogPostPageProps {
  slug: string;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug }) => {
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/blog/${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.success && data.post) {
        setPost(data.post);
        // Also fetch related articles
        fetchRelated(data.post.category);
      } else {
        setError(data.message || 'Article not found.');
      }
    } catch {
      setError('Unable to load article. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (category: string) => {
    try {
      const res = await fetch('/api/public/blog');
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        const others = data.posts
          .filter((p: BlogPostSummary) => p.slug !== slug)
          .slice(0, 3);
        setRelatedPosts(others);
      }
    } catch {
      // non-blocking
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!post) return;
    const text = encodeURIComponent(`*${post.title}*\nRead more on Sangita Travels Blog:\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ background: '#0A0F1D', minHeight: '100dvh', color: '#F8FAFC' }}>
        <Header />
        <div style={{ paddingTop: '140px', textAlign: 'center', color: '#60A5FA', fontSize: '1.2rem' }}>
          Loading article...
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ background: '#0A0F1D', minHeight: '100dvh', color: '#F8FAFC' }}>
        <Header />
        <main style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              padding: '48px 24px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '20px',
            }}
          >
            <BookOpen size={48} color="#F87171" style={{ marginBottom: '16px' }} />
            <h1 style={{ fontSize: '1.8rem', margin: '0 0 12px 0' }}>Article Not Found</h1>
            <p style={{ color: '#94A3B8', margin: '0 0 24px 0' }}>{error || "The requested article could not be located."}</p>
            <a
              href="#/blog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: '#2563EB',
                color: '#FFF',
                borderRadius: '10px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> Back to All Articles
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: '#0A0F1D', minHeight: '100dvh', color: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Header />

      <main id="main-content" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>

          {/* Breadcrumbs & Back link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
              fontSize: '0.88rem',
              color: '#94A3B8',
            }}
          >
            <a
              href="#/blog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#60A5FA',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} /> Back to Blog
            </a>

            {/* Social Share Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleShareWhatsApp}
                title="Share via WhatsApp"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  color: '#25D366',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button
                onClick={handleCopyLink}
                title="Copy link to clipboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#F8FAFC',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={15} color="#10B981" /> : <Share2 size={15} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Article Header */}
          <header style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#60A5FA',
                marginBottom: '16px',
              }}
            >
              {post.category}
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.7rem)',
                fontWeight: 800,
                lineHeight: 1.25,
                margin: '0 0 20px 0',
                color: '#FFFFFF',
              }}
            >
              {post.title}
            </h1>

            {/* Author & Meta bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '20px',
                paddingBottom: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                fontSize: '0.88rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="#60A5FA" /> {post.author}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#60A5FA" /> 3 min read
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={15} color="#10B981" /> {post.views_count} views
              </span>
            </div>
          </header>

          {/* Hero Featured Image */}
          {post.featured_image && (
            <div
              style={{
                width: '100%',
                maxHeight: '440px',
                borderRadius: '20px',
                overflow: 'hidden',
                marginBottom: '40px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
              }}
            >
              <img
                src={post.featured_image}
                alt={post.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Article Layout Grid (Content + Quick Booking Sidebar) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) clamp(280px, 30%, 340px)',
              gap: '40px',
              alignItems: 'start',
            }}
          >
            {/* Main Content Body */}
            <div
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.8,
                color: '#CBD5E1',
              }}
            >
              {/* Excerpt callout */}
              {post.excerpt && (
                <div
                  style={{
                    padding: '20px 24px',
                    background: 'rgba(37, 99, 235, 0.08)',
                    borderLeft: '4px solid #3B82F6',
                    borderRadius: '0 12px 12px 0',
                    marginBottom: '32px',
                    fontSize: '1.1rem',
                    fontStyle: 'italic',
                    color: '#E2E8F0',
                  }}
                >
                  "{post.excerpt}"
                </div>
              )}

              {/* Rendered HTML with styling */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
                dangerouslySetInnerHTML={{ __html: post.content_html }}
              />

              {/* Tags */}
              {post.tags && (
                <div
                  style={{
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Tags:</span>
                  {post.tags.split(',').map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#94A3B8',
                      }}
                    >
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Booking Sticky Sidebar */}
            <aside
              style={{
                position: 'sticky',
                top: '100px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
                <Sparkles size={16} /> Instant Cab Dispatch
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 10px 0', color: '#FFFFFF' }}>
                Book This Route Now
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                Door-to-door express AC cab from Pune to Mumbai, Airport, or Outstation.
              </p>

              <div
                style={{
                  background: 'rgba(10, 15, 29, 0.6)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Fares Starting From</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981' }}>
                  ₹2,299 <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 400 }}>/ sedan all-incl.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href="#booking-widget"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: '#2563EB',
                    color: '#FFF',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  <Compass size={16} /> Book Online
                </a>

                <a
                  href="https://wa.me/918261021008?text=Hello%20Sangita%20Travels,%20I%20am%20reading%20your%20blog%20and%20want%20to%20book%20a%20cab."
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: 'rgba(37, 211, 102, 0.15)',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    color: '#25D366',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  <MessageCircle size={16} /> WhatsApp Booking
                </a>

                <a
                  href="tel:+918261021008"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#F8FAFC',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  <Phone size={15} color="#60A5FA" /> 8261021008
                </a>
              </div>
            </aside>
          </div>

          {/* Related Articles Carousel / Grid */}
          {relatedPosts.length > 0 && (
            <section style={{ marginTop: '70px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 24px 0', color: '#FFFFFF' }}>
                Related Travel Guides
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                  gap: '24px',
                }}
              >
                {relatedPosts.map(rel => (
                  <a
                    key={rel.id}
                    href={`#/blog/${rel.slug}`}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                  >
                    <img
                      src={rel.featured_image}
                      alt={rel.title}
                      style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700, marginBottom: '6px' }}>
                        {rel.category}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: '#F8FAFC', lineHeight: 1.35 }}>
                        {rel.title}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {rel.excerpt}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
