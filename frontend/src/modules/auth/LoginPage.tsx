import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Modal } from '../shared/Modal';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, KeyRound, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

export const LoginPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanIdent = identifier.trim();
    const cleanPwd = password.trim();

    if (!cleanIdent || !cleanPwd) {
      setErrorMsg('Please enter your email or username and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(cleanIdent, cleanPwd, remember);
    setIsLoading(false);

    if (result.success) {
      setSuccessMsg('✓ Authentication successful. Redirecting to dashboard...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.hash = '#/admin/dashboard';
        }
      }, 400);
    } else {
      setErrorMsg(result.error || 'Invalid credentials. Please verify your login.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryMsg('');

    if (!recoveryEmail.trim()) {
      setRecoveryError('Please enter your registered email address or username.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/api/auth/forgot-password', {
        email: recoveryEmail.trim()
      });
      setRecoveryMsg(res.message || 'If an account exists, password recovery instructions have been dispatched.');
    } catch (err: any) {
      setRecoveryError(err.message || 'Failed to dispatch recovery request. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #0F172A 0%, #020617 100%)',
        padding: '24px 16px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(37, 99, 235, 0.1)',
          color: '#F8FAFC',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
            }}
          >
            <ShieldCheck size={36} color="#FFFFFF" />
          </div>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              margin: '0 0 6px 0',
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
            }}
          >
            Sangita Travels Pune
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
            Secure Administrative Portal & Fleet Operations
          </p>
        </div>

        {/* Security / Error Alerts */}
        {errorMsg && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6EE7B7',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              marginBottom: '20px',
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="admin-identifier"
              style={{
                display: 'block',
                fontSize: '0.825rem',
                color: '#CBD5E1',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              Email or Username
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '12px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Mail size={18} />
              </span>
              <input
                id="admin-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="admin@sangitatravels.com or username"
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="admin-password"
              style={{
                display: 'block',
                fontSize: '0.825rem',
                color: '#CBD5E1',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '12px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Lock size={18} />
              </span>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '11px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '26px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.825rem',
                color: '#94A3B8',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: '#2563EB', cursor: 'pointer', width: '15px', height: '15px' }}
              />
              Remember session (30 days)
            </label>

            <button
              type="button"
              onClick={() => {
                setRecoveryError('');
                setRecoveryMsg('');
                setShowRecoveryModal(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#60A5FA',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Admin Portal'}</span>
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Lock size={12} color="#60A5FA" />
          <span>PBKDF2 Hashed • Rate-Limited • Server-Enforced RBAC</span>
        </div>
      </div>

      {/* Self-Service Password Recovery Modal */}
      <Modal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        title="Admin Password Recovery"
      >
        <form onSubmit={handleForgotPassword} style={{ padding: '4px' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '18px', lineHeight: 1.5 }}>
            Enter your registered administrator email address. If an authorized account is found, a secure one-time password reset code will be generated.
          </p>

          {recoveryError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}
            >
              {recoveryError}
            </div>
          )}

          {recoveryMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6EE7B7',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}
            >
              {recoveryMsg}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="recovery-email"
              style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px', fontWeight: 600 }}
            >
              Administrator Email
            </label>
            <input
              id="recovery-email"
              type="text"
              value={recoveryEmail}
              onChange={e => setRecoveryEmail(e.target.value)}
              placeholder="e.g. shitalupadhye2001@gmail.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowRecoveryModal(false)}
              style={{
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recoveryLoading}
              style={{
                padding: '10px 18px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: recoveryLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {recoveryLoading ? 'Sending...' : 'Send Recovery Code'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
