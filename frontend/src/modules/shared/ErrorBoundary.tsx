import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { reportClientError } from '../../services/logger';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    reportClientError({
      message: error.message || 'React ErrorBoundary caught error',
      stack: `${error.stack || ''}\nComponentStack: ${errorInfo.componentStack || ''}`,
      url: window.location.href,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            background: '#0A0F1D',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div className="error-boundary-card">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#EF4444',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
                fontWeight: 800,
                marginBottom: '10px',
                color: '#F8FAFC',
              }}
            >
              Something Went Wrong
            </h1>

            <p
              style={{
                color: '#94A3B8',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              An unexpected error occurred while rendering the page. Don't worry, your booking
              details are safe. Please try refreshing or return to the home screen.
            </p>

            {this.state.error && (
              <details
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  color: '#FCA5A5',
                  marginBottom: '24px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  overflowX: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#F87171' }}>
                  Technical Error Details
                </summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.925rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                }}
              >
                <RefreshCw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#CBD5E1',
                  fontWeight: 600,
                  fontSize: '0.925rem',
                  cursor: 'pointer',
                }}
              >
                <Home size={16} />
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
