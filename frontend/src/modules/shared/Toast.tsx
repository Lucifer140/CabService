import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.95)',
    error: 'rgba(239, 68, 68, 0.95)',
    info: 'rgba(59, 130, 246, 0.95)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: bgColors[type],
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        fontSize: '0.9rem',
        fontWeight: 600,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backdropFilter: 'blur(8px)',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <span>{type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            marginLeft: '8px',
            fontSize: '1rem',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
