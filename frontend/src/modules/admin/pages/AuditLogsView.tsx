import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { AuditLog } from '../../../types';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; audit_logs: AuditLog[] }>('/api/audit-logs');
      if (res.success) {
        setLogs(res.audit_logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            Security Audit Trail
          </h3>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
            Immutable record of all administrative actions, logins & database modifications
          </div>
        </div>

        <button
          onClick={loadLogs}
          style={{
            padding: '8px 14px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.85rem',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Timestamp</th>
              <th style={{ padding: '12px 16px' }}>Operator</th>
              <th style={{ padding: '12px 16px' }}>Action</th>
              <th style={{ padding: '12px 16px' }}>Resource</th>
              <th style={{ padding: '12px 16px' }}>Details</th>
              <th style={{ padding: '12px 16px' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  {loading ? 'Loading audit records...' : 'No audit entries.'}
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px 16px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    {log.created_at}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#60A5FA' }}>
                    {log.user_name || 'System'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#93C5FD',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>
                    {log.resource}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>{log.details || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#94A3B8', fontFamily: 'monospace' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
