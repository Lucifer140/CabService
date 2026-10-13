import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import { Language } from './types';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; full: string }[] = [
    { code: 'en', label: 'EN', full: 'English' },
    { code: 'mr', label: 'मराठी', full: 'मराठी' },
    { code: 'hi', label: 'हिंदी', full: 'हिंदी' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Function to show/hide languages when clicking on the globe icon
  const toggleLanguages = () => {
    setIsOpen((prev) => !prev);
  };

  // Close language selector when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.85)',
        border: isOpen ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '999px',
        padding: '3px',
        gap: '2px',
        boxShadow: isOpen ? '0 2px 12px rgba(37, 99, 235, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.22s ease',
      }}
      role="group"
      aria-label="Language selection"
    >
      {/* Globe Icon Button: Click to show/hide languages */}
      <button
        type="button"
        onClick={toggleLanguages}
        aria-expanded={isOpen}
        aria-label="Select Language / भाषा निवडा"
        title={isOpen ? 'Close language options' : `Language: ${currentLang.full} (Click to switch)`}
        style={{
          background: isOpen ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: compact ? '4px 6px' : '5px 8px',
          borderRadius: '999px',
          color: '#60A5FA',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
      >
        <Globe
          size={compact ? 15 : 17}
          color="#60A5FA"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(15deg) scale(1.05)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Languages List: Shown when Globe is clicked */}
      {isOpen && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          {languages.map((l) => {
            const isActive = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
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
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#94A3B8';
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

