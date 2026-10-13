import React from 'react';
import { useLanguage } from './LanguageContext';
import { Language } from './types';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; full: string }[] = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'mr', label: 'मराठी', full: 'मराठी' },
    { code: 'hi', label: 'हिंदी', full: 'हिंदी' },
  ];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '999px',
        padding: '3px',
        gap: '2px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
      }}
      role="group"
      aria-label="Language selection"
    >
      <Globe size={compact ? 13 : 15} color="#60A5FA" style={{ marginLeft: '6px', marginRight: '3px', flexShrink: 0 }} />
      {languages.map((l) => {
        const isActive = language === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            aria-pressed={isActive}
            title={l.full}
            style={{
              background: isActive ? '#2563EB' : 'transparent',
              color: isActive ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderRadius: '999px',
              padding: compact ? '4px 8px' : '4px 10px',
              fontSize: compact ? '0.74rem' : '0.8rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              lineHeight: 1.2,
            }}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
};
