import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Customer } from '../../../types';
import { Search, User, Phone, Mail, Award } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get<{ success: boolean; customers: Customer[] }>(
        `/api/customers${params}`
      );
      if (res.success) {
        setCustomers(res.customers || []);
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
            Customer Directory (CRM)
          </h3>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
            List of all repeat travellers & contact histories
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }}
          />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 12px 8px 34px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              minWidth: '260px',
            }}
          />
        </div>
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
              <th style={{ padding: '14px 16px' }}>Name</th>
              <th style={{ padding: '14px 16px' }}>Phone</th>
              <th style={{ padding: '14px 16px' }}>Email</th>
              <th style={{ padding: '14px 16px' }}>Bookings</th>
              <th style={{ padding: '14px 16px' }}>Preferred Cab</th>
              <th style={{ padding: '14px 16px' }}>Last Journey</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  {loading ? 'Loading customer records...' : 'No customers found.'}
                </td>
              </tr>
            ) : (
              customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#F8FAFC' }}>
                    {c.name}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#60A5FA', fontWeight: 600 }}>
                    {c.phone}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{c.email || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34D399',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {c.total_bookings} trips
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>
                    {c.preferred_vehicle || 'Standard Sedan'}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{c.last_trip || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
