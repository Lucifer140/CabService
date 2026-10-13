import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Save, Check } from 'lucide-react';

export const CmsView: React.FC = () => {
  const [content, setContent] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const res = await api.get<{ success: boolean; content: Record<string, string> }>(
        '/api/content'
      );
      if (res.success) {
        setContent(res.content || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await api.post('/api/content/batch', { blocks: content });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Saving failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC' }}>
            Website Content CMS
          </h3>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
            Live content editing for customer website headlines and sections
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '10px 20px',
            background: savedSuccess ? '#10B981' : '#2563EB',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          <span>
            {savedSuccess ? 'Changes Saved!' : isSaving ? 'Saving...' : 'Save All Changes'}
          </span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '800px' }}>
        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h4
            style={{
              margin: '0 0 16px 0',
              fontSize: '1rem',
              color: '#60A5FA',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '8px',
            }}
          >
            Hero Banner Section
          </h4>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#94A3B8',
                marginBottom: '6px',
              }}
            >
              Hero Title
            </label>
            <input
              type="text"
              value={content['hero.title'] || 'Pune to Mumbai Cab Service'}
              onChange={e => handleChange('hero.title', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1E293B',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#94A3B8',
                marginBottom: '6px',
              }}
            >
              Hero Subtitle
            </label>
            <input
              type="text"
              value={content['hero.subtitle'] || 'Doorstep Pickup • Fixed Toll Rates • Chilled AC'}
              onChange={e => handleChange('hero.subtitle', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1E293B',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#94A3B8',
                marginBottom: '6px',
              }}
            >
              Hero Description
            </label>
            <textarea
              rows={3}
              value={
                content['hero.description'] ||
                'Experience seamless highway journeys with sanitized sedans, certified drivers & transparent fares. One-way drops to Mumbai Airport starting from just ₹2,299.'
              }
              onChange={e => handleChange('hero.description', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1E293B',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: '#131B2E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h4
            style={{
              margin: '0 0 16px 0',
              fontSize: '1rem',
              color: '#60A5FA',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '8px',
            }}
          >
            Contact & Helpline Overrides
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                }}
              >
                Official Helpline Phone
              </label>
              <input
                type="text"
                value={content['hero.phone'] || '8261021008'}
                onChange={e => handleChange('hero.phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  marginBottom: '6px',
                }}
              >
                WhatsApp Number
              </label>
              <input
                type="text"
                value={content['hero.whatsapp'] || '918261021008'}
                onChange={e => handleChange('hero.whatsapp', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
