import React, { useState, useEffect } from 'react';
import { Header } from '../shared/Header';
import { Footer } from '../shared/Footer';
import { Search, Calendar, User, Eye, Clock, ArrowRight, ArrowLeft, BookOpen, Sparkles, Phone, Compass } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  author: string;
  category: string;
  tags: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/public/blog');
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
      } else {
        setError('Failed to load blog articles.');
      }
    } catch {
      setError('Network error while fetching blog articles.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ background: '#0A0F1D', minHeight: '100dvh', color: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <Header />

      <main id="main-content" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        {/* Hero Section */}

        <section
          style={{
            padding: 'clamp(40px, 6vw, 70px) clamp(16px, 4vw, 32px)',
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '999px',
              color: '#60A5FA',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '18px',
            }}
          >
            <Sparkles size={14} /> Official Travel & Route Guides
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #93C5FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Pune-Mumbai Highway & Travel Blog
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: '#94A3B8',
              maxWidth: '740px',
              margin: '0 auto 36px auto',
              lineHeight: 1.6,
            }}
          >
            Expert advice on expressway travel times, Mumbai Airport departures, scenic stopovers, temple yatras, and affordable outstation cab rentals.
          </p>

          {/* Search & Category Filter Bar */}
          <div
            style={{
              maxWidth: '700px',
              margin: '0 auto 28px auto',
              position: 'relative',
            }}
          >
            <Search
              size={18}
              color="#64748B"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search route guides, airport tips, destinations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#F8FAFC',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                backdropFilter: 'blur(8px)',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = '#3B82F6')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
            />
          </div>

          {/* Category Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: selectedCategory === cat ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedCategory === cat ? '#2563EB' : 'rgba(15, 23, 42, 0.6)',
                  color: selectedCategory === cat ? '#FFFFFF' : '#94A3B8',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Articles List / Grid */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#60A5FA', fontSize: '1.1rem' }}>
              Loading articles...
            </div>
          ) : error ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '16px',
                maxWidth: '500px',
                margin: '40px auto',
              }}
            >
              <p style={{ color: '#F87171', margin: '0 0 16px 0' }}>{error}</p>
              <button
                onClick={fetchPosts}
                style={{
                  padding: '10px 20px',
                  background: '#2563EB',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <BookOpen size={48} color="#64748B" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', color: '#E2E8F0' }}>No articles found</h3>
              <p style={{ color: '#94A3B8', margin: '0 0 20px 0' }}>
                Try adjusting your search query or selecting a different category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                style={{
                  padding: '8px 18px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#F8FAFC',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
                gap: '28px',
              }}
            >
              {filteredPosts.map(post => (
                <article
                  key={post.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.boxShadow = '0 16px 36px rgba(37, 99, 235, 0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
                  }}
                >
                  {/* Article Thumbnail */}
                  <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                    <img
                      src={post.featured_image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'}
                      alt={post.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '4px 10px',
                        background: 'rgba(10, 15, 29, 0.85)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#60A5FA',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {post.category}
                    </div>
                  </div>

                  {/* Article Body */}
                  <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    {/* Meta info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        fontSize: '0.8rem',
                        color: '#94A3B8',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="#60A5FA" /> 3 min read
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} color="#10B981" /> {post.views_count || 0}
                      </span>
                    </div>

                    {/* Title */}
                    <h2
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        margin: '0 0 10px 0',
                        color: '#F8FAFC',
                      }}
                    >
                      <a
                        href={`#/blog/${post.slug}`}
                        style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#F8FAFC')}
                      >
                        {post.title}
                      </a>
                    </h2>

                    {/* Excerpt */}
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: '#94A3B8',
                        lineHeight: 1.55,
                        margin: '0 0 18px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flexGrow: 1,
                      }}
                    >
                      {post.excerpt}
                    </p>

                    {/* Footer / CTA link */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        marginTop: 'auto',
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} /> {post.author.split(' ')[0]}
                      </span>
                      <a
                        href={`#/blog/${post.slug}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#3B82F6',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'gap 0.2s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.gap = '10px')}
                        onMouseLeave={e => (e.currentTarget.style.gap = '6px')}
                      >
                        Read Article <ArrowRight size={15} />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Highway Travel CTA Banner */}
        <section style={{ maxWidth: '1200px', margin: '70px auto 0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '24px',
              padding: 'clamp(28px, 5vw, 48px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                fontSize: '2rem',
                marginBottom: '10px',
              }}
            >
              🚕
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                fontWeight: 800,
                margin: '0 0 12px 0',
                color: '#FFFFFF',
              }}
            >
              Planning Your Pune-Mumbai Road Trip?
            </h2>
            <p
              style={{
                maxWidth: '650px',
                color: '#CBD5E1',
                fontSize: '1rem',
                lineHeight: 1.6,
                margin: '0 0 28px 0',
              }}
            >
              Book an AC sedan or luxury SUV with verified chauffeurs starting at just ₹2,299. FastTag toll included, zero hidden charges, and instant booking confirmation.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
              <a
                href="#booking-widget"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
                }}
              >
                <Compass size={18} /> Book Cab Now
              </a>
              <a
                href="tel:+918261021008"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Phone size={18} color="#60A5FA" /> Call 24/7 Desk: 8261021008
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
