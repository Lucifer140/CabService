import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { Vehicle } from '../../../types';
import { Modal } from '../../shared/Modal';
import { Plus, Edit2, Trash2, Car, Users, Briefcase } from 'lucide-react';

export const FleetView: React.FC = () => {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [vKey, setVKey] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sedan');
  const [passengers, setPassengers] = useState(4);
  const [luggage, setLuggage] = useState<number | string>(2);
  const [pricingBase, setPricingBase] = useState(2299);
  const [pricingPerKm, setPricingPerKm] = useState(14);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('active');

  useEffect(() => {
    loadFleet();
  }, []);

  const loadFleet = async () => {
    try {
      const res = await api.get<{ success: boolean; vehicles: Vehicle[] }>('/api/fleet');
      if (res.success) {
        setFleet(res.vehicles || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (v?: Vehicle) => {
    if (v) {
      setEditingVehicle(v);
      setVKey(v.vehicle_key);
      setName(v.name);
      setCategory(v.category);
      setPassengers(v.passenger_capacity);
      setLuggage(v.luggage_capacity);
      setPricingBase(v.pricing_base);
      setPricingPerKm(v.pricing_per_km);
      setDescription(v.description);
      setStatus(v.status);
    } else {
      setEditingVehicle(null);
      setVKey('');
      setName('');
      setCategory('Sedan');
      setPassengers(4);
      setLuggage(2);
      setPricingBase(2299);
      setPricingPerKm(14);
      setDescription('');
      setStatus('active');
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        vehicle_key: vKey,
        name,
        category,
        passenger_capacity: passengers,
        luggage_capacity: luggage,
        pricing_base: pricingBase,
        pricing_per_km: pricingPerKm,
        description,
        status,
      };

      if (editingVehicle) {
        await api.put(`/api/fleet/${editingVehicle.vehicle_key}`, payload);
      } else {
        await api.post('/api/fleet', payload);
      }

      setModalOpen(false);
      loadFleet();
    } catch (err: any) {
      alert(err.message || 'Saving vehicle failed');
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm(`Delete vehicle ${key}?`)) return;
    try {
      await api.delete(`/api/fleet/${key}`);
      loadFleet();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
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
            Fleet Inventory Management
          </h3>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
            Configure active cabs, fare baselines & passenger capacity
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            padding: '10px 18px',
            background: '#2563EB',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          <span>Add New Vehicle</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {fleet.map(v => (
          <div
            key={v.id || v.vehicle_key}
            style={{
              background: '#131B2E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#F8FAFC',
                    }}
                  >
                    {v.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 600 }}>
                    ID: {v.vehicle_key}
                  </span>
                </div>
                <span
                  style={{
                    background:
                      v.status === 'active'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color: v.status === 'active' ? '#34D399' : '#FCA5A5',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {v.status.toUpperCase()}
                </span>
              </div>

              <p
                style={{
                  color: '#94A3B8',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  marginBottom: '14px',
                }}
              >
                {v.description || 'Chilled AC verified cab'}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  fontSize: '0.8rem',
                  color: '#CBD5E1',
                  marginBottom: '16px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} color="#60A5FA" /> {v.passenger_capacity} seats
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={14} color="#60A5FA" />{' '}
                  {String(v.luggage_capacity || '')
                    .toLowerCase()
                    .includes('bag')
                    ? v.luggage_capacity
                    : `${v.luggage_capacity} bags`}
                </span>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Base Drop Fare</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
                  ₹{v.pricing_base}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenModal(v)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(v.vehicle_key)}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehicle ? `Edit ${editingVehicle.name}` : 'Add New Vehicle'}
      >
        <form onSubmit={handleSave}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  marginBottom: '4px',
                }}
              >
                Key (Slug)
              </label>
              <input
                type="text"
                value={vKey}
                onChange={e => setVKey(e.target.value)}
                placeholder="e.g. ciaz"
                disabled={!!editingVehicle}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
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
                  marginBottom: '4px',
                }}
              >
                Vehicle Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maruti Ciaz (Sedan)"
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
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
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  marginBottom: '4px',
                }}
              >
                Seats
              </label>
              <input
                type="number"
                value={passengers}
                onChange={e => setPassengers(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
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
                  marginBottom: '4px',
                }}
              >
                Luggage Bags
              </label>
              <input
                type="number"
                value={luggage}
                onChange={e => setLuggage(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
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
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  marginBottom: '4px',
                }}
              >
                Base Fare (₹)
              </label>
              <input
                type="number"
                value={pricingBase}
                onChange={e => setPricingBase(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
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
                  marginBottom: '4px',
                }}
              >
                Rate/km (₹)
              </label>
              <input
                type="number"
                value={pricingPerKm}
                onChange={e => setPricingPerKm(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#94A3B8',
                marginBottom: '4px',
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#1E293B',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Vehicle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
