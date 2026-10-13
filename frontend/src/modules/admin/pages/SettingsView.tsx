import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Download, Save, Check, Database, Phone, Mail, Shield } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get<{ success: boolean; settings: Record<string, string> }>(
        '/api/settings'
      );
      if (res.success) {
        setSettings(res.settings || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await api.post('/api/settings/batch', { settings });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Saving failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const token = localStorage.getItem('admin_token') || '';
    window.open(`/api/export/backup-sql?token=${token}`, '_blank');
  };

  return (
    <div style={{ maxWidth: '800px' }}>
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
            System Configuration & Backup
          </h3>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
            Manage official helpline credentials and relational database backups
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
          <span>{savedSuccess ? 'Settings Saved!' : isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Database Backup Card */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Database size={24} color="#3B82F6" />
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#F8FAFC' }}>
            Enterprise Relational Database Backup
          </h4>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '18px' }}>
          Generates a full transactional SQL dump of all tables (Bookings, Customers, Admins, Fleet,
          CMS blocks, Settings) from SQLite WAL mode.
        </p>
        <button
          type="button"
          onClick={handleDownloadBackup}
          style={{
            padding: '10px 18px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            color: '#93C5FD',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Download size={16} />
          <span>Download SQLite SQL Backup Dump</span>
        </button>
      </div>

      {/* Business Contacts Settings */}
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
          Official Business Credentials
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
              Business Name
            </label>
            <input
              type="text"
              value={settings['business_name'] || 'Sangita Travels Pune'}
              onChange={e => handleChange('business_name', e.target.value)}
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
              Helpline Phone
            </label>
            <input
              type="text"
              value={settings['business_phone'] || '+918261021008'}
              onChange={e => handleChange('business_phone', e.target.value)}
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
              WhatsApp Number
            </label>
            <input
              type="text"
              value={settings['business_whatsapp'] || '918261021008'}
              onChange={e => handleChange('business_whatsapp', e.target.value)}
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
              Support Email
            </label>
            <input
              type="email"
              value={settings['business_email'] || 'sangitatravels08@gmail.com'}
              onChange={e => handleChange('business_email', e.target.value)}
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

        <div>
          <label
            style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}
          >
            Physical Office Address
          </label>
          <input
            type="text"
            value={settings['business_address'] || 'Pune, Maharashtra, India'}
            onChange={e => handleChange('business_address', e.target.value)}
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
  );
};
