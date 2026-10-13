/**
 * Frontend Client-Side Error Tracking & Telemetry
 * Captures uncaught window errors, unhandled promise rejections, and ErrorBoundary reports
 * and forwards them to the backend structured logging endpoint.
 */

let lastReportTime = 0;

export interface ClientErrorReport {
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  col?: number;
}

export function reportClientError(report: ClientErrorReport): void {
  const now = Date.now();
  // Throttle to at most one client error report every 2 seconds
  if (now - lastReportTime < 2000) return;
  lastReportTime = now;

  const payload = {
    message: report.message,
    stack: report.stack ? report.stack.slice(0, 1500) : '',
    url: report.url || window.location.href,
    line: report.line,
    col: report.col,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/public/client-error', blob);
    } else {
      fetch('/api/public/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently to never interrupt UX
  }
}

export function initGlobalErrorTracking(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    reportClientError({
      message: event.message || 'Script error',
      stack: event.error?.stack || '',
      url: event.filename || window.location.href,
      line: event.lineno,
      col: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : '';
    reportClientError({
      message: `Unhandled Promise Rejection: ${msg}`,
      stack: stack,
      url: window.location.href,
    });
  });
}
