import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../services/api';
import { PricingRule, Vehicle } from '../../../types';
import { Modal } from '../../shared/Modal';
import { Toast } from '../../shared/Toast';
import {
  DollarSign,
  Calculator,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Car,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export const PricingView: React.FC = () => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'INTERNAL'>('ALL');

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [vehicleKey, setVehicleKey] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [perKm, setPerKm] = useState<string>('12.0');
  const [minKm, setMinKm] = useState<string>('130');
  const [driverAllowance, setDriverAllowance] = useState<string>('300.0');
  const [onewayPuneMumbai, setOnewayPuneMumbai] = useState<string>('2299.0');
  const [roundtripBase, setRoundtripBase] = useState<string>('4500.0');
  const [airportRate, setAirportRate] = useState<string>('2299.0');
  const [showPricePublic, setShowPricePublic] = useState<number>(0);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<PricingRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Calculator State
  const [calcVehicleKey, setCalcVehicleKey] = useState<string>('dzire');
  const [calcTripType, setCalcTripType] = useState<
    'oneway' | 'roundtrip' | 'airport' | 'outstation'
  >('oneway');
  const [calcDistance, setCalcDistance] = useState<number>(150);
  const [calcDays, setCalcDays] = useState<number>(1);
  const [calcIncludeTolls, setCalcIncludeTolls] = useState<boolean>(true);
  const [calcTollAmount, setCalcTollAmount] = useState<number>(430); // Mumbai Expressway Toll approx ₹430
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pricingRes, fleetRes] = await Promise.all([
        api.get<{ success: boolean; rules: PricingRule[] }>('/api/pricing'),
        api.get<{ success: boolean; vehicles: Vehicle[] }>('/api/fleet').catch(() => ({
          success: false,
          vehicles: [],
        })),
      ]);

      if (pricingRes.success) {
        setRules(pricingRes.rules || []);
      }
      if (fleetRes.success) {
        setFleet(fleetRes.vehicles || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load pricing rate cards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<{ success: boolean; rules: PricingRule[] }>('/api/pricing'),
      api.get<{ success: boolean; vehicles: Vehicle[] }>('/api/fleet').catch(() => ({
        success: false,
        vehicles: [],
      })),
    ])
      .then(([pricingRes, fleetRes]) => {
        if (!active) return;
        if (pricingRes.success) {
          setRules(pricingRes.rules || []);
          if (pricingRes.rules?.length > 0) {
            setCalcVehicleKey(pricingRes.rules[0].vehicle_key);
          }
        }
        if (fleetRes.success) {
          setFleet(fleetRes.vehicles || []);
        }
      })
      .catch((err: any) => {
        if (active) {
          showToast(err.message || 'Failed to load pricing rate cards', 'error');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenModal = (rule?: PricingRule) => {
    if (rule) {
      setEditingRule(rule);
      setVehicleKey(rule.vehicle_key || '');
      setVehicleName(rule.vehicle_name || '');
      setPerKm(String(rule.per_km ?? 12));
      setMinKm(String(rule.min_km ?? 130));
      setDriverAllowance(String(rule.driver_allowance ?? 300));
      setOnewayPuneMumbai(String(rule.oneway_pune_mumbai ?? 2299));
      setRoundtripBase(String(rule.roundtrip_base ?? 4500));
      setAirportRate(String(rule.airport_rate ?? 2299));
      setShowPricePublic(rule.show_price_public !== undefined ? rule.show_price_public : 0);
    } else {
      setEditingRule(null);
      // Auto-suggest first fleet vehicle not yet in rules
      const existingKeys = new Set(rules.map(r => r.vehicle_key.toLowerCase()));
      const availableFleet = fleet.find(f => !existingKeys.has(f.vehicle_key.toLowerCase()));

      if (availableFleet) {
        setVehicleKey(availableFleet.vehicle_key.toLowerCase());
        setVehicleName(availableFleet.name);
        setPerKm(String(availableFleet.pricing_per_km || 13));
        setOnewayPuneMumbai(String(availableFleet.pricing_base || 2299));
        setRoundtripBase(String((availableFleet.pricing_base || 2299) * 2));
      } else {
        setVehicleKey('');
        setVehicleName('');
        setPerKm('13.0');
        setOnewayPuneMumbai('2299.0');
        setRoundtripBase('4598.0');
      }

      setMinKm('130');
      setDriverAllowance('300.0');
      setAirportRate('2299.0');
      setShowPricePublic(1);
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleKey.trim() || !vehicleName.trim()) {
      showToast('Vehicle Key and Vehicle Name are required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        vehicle_key: vehicleKey.trim().toLowerCase(),
        vehicle_name: vehicleName.trim(),
        per_km: parseFloat(perKm) || 12.0,
        min_km: parseInt(minKm) || 130,
        driver_allowance: parseFloat(driverAllowance) || 300.0,
        oneway_pune_mumbai: parseFloat(onewayPuneMumbai) || 2299.0,
        roundtrip_base: parseFloat(roundtripBase) || 4500.0,
        airport_rate: parseFloat(airportRate) || 2299.0,
        show_price_public: showPricePublic,
      };

      if (editingRule) {
        await api.put(`/api/pricing/${editingRule.id}`, payload);
        showToast(`Pricing rule for "${vehicleName}" updated successfully`, 'success');
      } else {
        await api.post('/api/pricing', payload);
        showToast(`Pricing rule for "${vehicleName}" created successfully`, 'success');
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save pricing rule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (rule: PricingRule) => {
    try {
      const newStatus = rule.show_price_public === 1 ? 0 : 1;
      await api.put(`/api/pricing/${rule.id}`, {
        show_price_public: newStatus,
      });
      showToast(
        `Rate card for "${rule.vehicle_name}" is now ${newStatus === 1 ? 'Publicly Visible' : 'Internal Only'}`,
        'success'
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle visibility status', 'error');
    }
  };

  const confirmDelete = (rule: PricingRule) => {
    setRuleToDelete(rule);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/pricing/${ruleToDelete.id}`);
      showToast(`Pricing rule for "${ruleToDelete.vehicle_name}" removed`, 'success');
      setDeleteModalOpen(false);
      setRuleToDelete(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete pricing rule', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered pricing rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        r.vehicle_name.toLowerCase().includes(q) ||
        r.vehicle_key.toLowerCase().includes(q);

      const matchesVisibility =
        visibilityFilter === 'ALL' ||
        (visibilityFilter === 'PUBLIC' && r.show_price_public === 1) ||
        (visibilityFilter === 'INTERNAL' && r.show_price_public === 0);

      return matchesSearch && matchesVisibility;
    });
  }, [rules, search, visibilityFilter]);

  // Selected Rule for Calculator
  const selectedCalcRule = useMemo(() => {
    const found = rules.find(r => r.vehicle_key.toLowerCase() === calcVehicleKey.toLowerCase());
    return found || rules[0] || null;
  }, [rules, calcVehicleKey]);

  // Real-Time Calculation Results
  const fareCalculation = useMemo(() => {
    if (!selectedCalcRule) {
      return {
        baseRate: 0,
        distanceCharge: 0,
        driverAllowanceTotal: 0,
        tolls: 0,
        totalFare: 0,
        formula: 'No rate card selected',
      };
    }

    const { per_km, min_km, driver_allowance, oneway_pune_mumbai, roundtrip_base, airport_rate } =
      selectedCalcRule;

    let baseRate: number;
    let distanceCharge: number;
    let driverAllowanceTotal: number;
    let formula: string;

    if (calcTripType === 'oneway') {
      baseRate = oneway_pune_mumbai;
      distanceCharge = 0;
      driverAllowanceTotal = 0;
      formula = `Flat One-Way Pune-Mumbai Package (Includes Fuel & Driver Allowance)`;
    } else if (calcTripType === 'airport') {
      baseRate = airport_rate;
      distanceCharge = 0;
      driverAllowanceTotal = 0;
      formula = `Dedicated Airport Transfer Package (Pune to Mumbai Airport BOM T1/T2)`;
    } else if (calcTripType === 'roundtrip') {
      baseRate = roundtrip_base;
      const billedKm = Math.max(min_km * 2, calcDistance);
      const extraKm = Math.max(0, billedKm - min_km * 2);
      distanceCharge = extraKm * per_km;
      driverAllowanceTotal = (calcDays - 1) * driver_allowance;
      formula = `Base Round-Trip (₹${roundtrip_base}) + ${extraKm > 0 ? `${extraKm} extra km @ ₹${per_km}/km + ` : ''}${calcDays > 1 ? `${calcDays - 1} night halt(s) @ ₹${driver_allowance}/day` : 'Same day return'}`;
    } else {
      // Outstation / Custom Distance
      const billedKm = Math.max(min_km * calcDays, calcDistance);
      distanceCharge = billedKm * per_km;
      driverAllowanceTotal = calcDays * driver_allowance;
      baseRate = 0;
      formula = `${billedKm} billed km (min ${min_km} km/day × ${calcDays} days) @ ₹${per_km}/km + ${calcDays} day(s) driver allowance @ ₹${driver_allowance}/day`;
    }

    const tolls = calcIncludeTolls ? calcTollAmount : 0;
    const totalFare = Math.round(baseRate + distanceCharge + driverAllowanceTotal + tolls);

    return {
      baseRate,
      distanceCharge,
      driverAllowanceTotal,
      tolls,
      totalFare,
      formula,
    };
  }, [selectedCalcRule, calcTripType, calcDistance, calcDays, calcIncludeTolls, calcTollAmount]);

  const copyQuoteToClipboard = () => {
    if (!selectedCalcRule) return;
    const text =
      `🚕 Sangita Travels - Cab Fare Estimate\n` +
      `Vehicle: ${selectedCalcRule.vehicle_name}\n` +
      `Trip Type: ${calcTripType.toUpperCase()}\n` +
      `Distance: ${calcDistance} km (${calcDays} day${calcDays > 1 ? 's' : ''})\n` +
      `Fare Breakdown: ${fareCalculation.formula}\n` +
      (calcIncludeTolls ? `Tolls & FastTag: ₹${calcTollAmount} (Included)\n` : '') +
      `Total Estimated Fare: ₹${fareCalculation.totalFare}\n` +
      `Call / WhatsApp: (+91) 8261021008`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    showToast('Fare quote copied to clipboard!', 'success');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const publicCount = rules.filter(r => r.show_price_public === 1).length;
  const avgPerKm = rules.length
    ? (rules.reduce((acc, r) => acc + r.per_km, 0) / rules.length).toFixed(1)
    : '0';

  return (
    <div>
      {/* Toast Feedback */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Banner & Stats */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
            }}
          >
            <DollarSign size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
              Pricing Rules & Rate Cards Engine
            </h2>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
              Configure per-km slabs, flat intercity routes, driver allowances & simulate real-time
              quotes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              gap: '14px',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '6px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: '#94A3B8' }}>
              Vehicles: <strong style={{ color: '#F8FAFC' }}>{rules.length}</strong>
            </span>
            <span style={{ color: '#60A5FA' }}>
              Avg Rate: <strong>₹{avgPerKm}/km</strong>
            </span>
            <span style={{ color: '#10B981' }}>
              Public Cards: <strong>{publicCount}</strong>
            </span>
          </div>

          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: '10px 18px',
              background: '#2563EB',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'background 0.2s',
            }}
          >
            <Plus size={18} />
            <span>Add Pricing Rule</span>
          </button>
        </div>
      </div>

      {/* REAL-TIME FARE CALCULATOR SECTION */}
      <div
        style={{
          background: 'linear-gradient(135deg, #131B2E 0%, #162038 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60A5FA',
              }}
            >
              <Calculator size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                Real-Time Fare Simulator & Quote Calculator
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                Test client quotes instantly against live database rate cards
              </span>
            </div>
          </div>

          <button
            onClick={copyQuoteToClipboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: copiedQuote ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: copiedQuote
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: copiedQuote ? '#34D399' : '#CBD5E1',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copiedQuote ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedQuote ? 'Quote Copied!' : 'Copy Quote'}</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(280px, 1fr)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Vehicle Selector & Trip Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#CBD5E1',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Select Vehicle Model
                </label>
                <select
                  value={calcVehicleKey}
                  onChange={e => setCalcVehicleKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {rules.map(r => (
                    <option key={r.id} value={r.vehicle_key}>
                      {r.vehicle_name} (₹{r.per_km}/km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#CBD5E1',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Trip Type
                </label>
                <select
                  value={calcTripType}
                  onChange={e => setCalcTripType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="oneway">One-Way (Pune to Mumbai)</option>
                  <option value="airport">Airport Transfer (BOM T1/T2)</option>
                  <option value="roundtrip">Round Trip (Pune-Mumbai-Pune)</option>
                  <option value="outstation">Outstation / Custom Distance</option>
                </select>
              </div>
            </div>

            {/* Distance Slider & Days */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '14px' }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <label style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>
                    Estimated Distance
                  </label>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: '#60A5FA',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    {calcDistance} KM
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={800}
                  step={10}
                  value={calcDistance}
                  onChange={e => setCalcDistance(parseInt(e.target.value) || 150)}
                  style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#CBD5E1',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Trip Days
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={calcDays}
                  onChange={e => setCalcDays(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Tolls & FastTag Option */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.4)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.825rem',
                  color: '#CBD5E1',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={calcIncludeTolls}
                  onChange={e => setCalcIncludeTolls(e.target.checked)}
                  style={{ accentColor: '#3B82F6' }}
                />
                <span>Include Express Highway Toll / FastTag</span>
              </label>

              {calcIncludeTolls && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>₹</span>
                  <input
                    type="number"
                    value={calcTollAmount}
                    onChange={e => setCalcTollAmount(parseInt(e.target.value) || 0)}
                    style={{
                      width: '70px',
                      padding: '4px 6px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      textAlign: 'right',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Fare Summary Receipt Card */}
          <div
            style={{
              background: '#0B1120',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px dashed rgba(255, 255, 255, 0.12)',
                  paddingBottom: '10px',
                  marginBottom: '12px',
                }}
              >
                <span style={{ color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Estimated Customer Fare
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  LIVE CALC
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '2.1rem',
                    fontWeight: 800,
                    color: '#F8FAFC',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  ₹{fareCalculation.totalFare.toLocaleString('en-IN')}
                </div>
                <div style={{ color: '#60A5FA', fontSize: '0.8rem', marginTop: '6px' }}>
                  {selectedCalcRule?.vehicle_name || 'Selected Cab'}
                </div>
              </div>

              {/* Breakdown lines */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                }}
              >
                {fareCalculation.baseRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Route Package Base:</span>
                    <strong style={{ color: '#CBD5E1' }}>₹{fareCalculation.baseRate}</strong>
                  </div>
                )}
                {fareCalculation.distanceCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Distance Fare:</span>
                    <strong style={{ color: '#CBD5E1' }}>
                      ₹{Math.round(fareCalculation.distanceCharge)}
                    </strong>
                  </div>
                )}
                {fareCalculation.driverAllowanceTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Driver Allowance ({calcDays}d):</span>
                    <strong style={{ color: '#CBD5E1' }}>
                      ₹{fareCalculation.driverAllowanceTotal}
                    </strong>
                  </div>
                )}
                {calcIncludeTolls && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tolls & FastTag:</span>
                    <strong style={{ color: '#CBD5E1' }}>₹{fareCalculation.tolls}</strong>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.72rem',
                color: '#64748B',
                lineHeight: 1.4,
              }}
            >
              {fareCalculation.formula}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Visibility Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'PUBLIC', 'INTERNAL'] as const).map(tab => {
            const isTabActive = visibilityFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setVisibilityFilter(tab)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: isTabActive ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isTabActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isTabActive ? '#93C5FD' : '#94A3B8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'ALL'
                  ? `All Rate Cards (${rules.length})`
                  : tab === 'PUBLIC'
                    ? `Publicly Displayed (${publicCount})`
                    : `Internal Only (${rules.length - publicCount})`}
              </button>
            );
          })}
        </div>

        {/* Search Input & Refresh */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748B' }}
            />
            <input
              type="text"
              placeholder="Search vehicle key or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '9px 12px 9px 36px',
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

          <button
            onClick={loadData}
            title="Refresh Rate Cards"
            style={{
              padding: '9px 12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw
              size={16}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* PRICING RULES TABLE */}
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
            <RefreshCw
              size={32}
              style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }}
            />
            <div>Loading pricing rules...</div>
          </div>
        ) : filteredRules.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <DollarSign size={44} color="#475569" style={{ marginBottom: '14px' }} />
            <h4 style={{ margin: '0 0 8px 0', color: '#E2E8F0', fontSize: '1.1rem' }}>
              No pricing rules found
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem' }}>
              {search || visibilityFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filter tags.'
                : 'Get started by creating your first vehicle rate card.'}
            </p>
            {(search || visibilityFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setVisibilityFilter('ALL');
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94A3B8',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '14px 20px' }}>Vehicle Rate Card</th>
                  <th style={{ padding: '14px 16px' }}>Per KM & Min</th>
                  <th style={{ padding: '14px 16px' }}>One-Way Pune-Mum</th>
                  <th style={{ padding: '14px 16px' }}>Round-Trip Base</th>
                  <th style={{ padding: '14px 16px' }}>Airport (BOM)</th>
                  <th style={{ padding: '14px 16px' }}>Driver Allowance</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Public Display</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((r, idx) => {
                  const isPublic = r.show_price_public === 1;
                  return (
                    <tr
                      key={r.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s',
                      }}
                    >
                      {/* Vehicle Key & Name */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: 'rgba(59, 130, 246, 0.12)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#60A5FA',
                              flexShrink: 0,
                            }}
                          >
                            <Car size={20} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: '#F8FAFC',
                                fontSize: '0.95rem',
                                marginBottom: '4px',
                              }}
                            >
                              {r.vehicle_name}
                            </div>
                            <div
                              style={{
                                display: 'inline-block',
                                color: '#64748B',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                background: 'rgba(15, 23, 42, 0.5)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              key: {r.vehicle_key}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Per-KM & Min KM */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: '#60A5FA',
                            }}
                          >
                            ₹{r.per_km}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}> / km</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px' }}>
                          Min: {r.min_km} km / day
                        </div>
                      </td>

                      {/* One-Way Pune to Mumbai */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#10B981',
                            fontSize: '0.95rem',
                          }}
                        >
                          ₹{r.oneway_pune_mumbai.toLocaleString('en-IN')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>all-inclusive</span>
                      </td>

                      {/* Round-Trip Base */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#F8FAFC',
                            fontSize: '0.95rem',
                          }}
                        >
                          ₹{r.roundtrip_base.toLocaleString('en-IN')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>return base</span>
                      </td>

                      {/* Airport Rate */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#93C5FD',
                            fontSize: '0.95rem',
                          }}
                        >
                          ₹{r.airport_rate.toLocaleString('en-IN')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>BOM T1/T2</span>
                      </td>

                      {/* Driver Allowance */}
                      <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                        <div style={{ color: '#E2E8F0', fontSize: '0.875rem', fontWeight: 600 }}>
                          ₹{r.driver_allowance}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                          per day / night
                        </span>
                      </td>

                      {/* Public Visibility Toggle */}
                      <td
                        style={{
                          padding: '16px',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                        }}
                      >
                        <button
                          onClick={() => handleToggleVisibility(r)}
                          title={`Click to switch to ${isPublic ? 'Internal Only' : 'Public Display'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: isPublic
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(148, 163, 184, 0.2)',
                            background: isPublic
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(148, 163, 184, 0.08)',
                            color: isPublic ? '#34D399' : '#94A3B8',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
                          <span>{isPublic ? 'Public' : 'Internal'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: '16px 20px',
                          verticalAlign: 'middle',
                          textAlign: 'right',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            onClick={() => {
                              setCalcVehicleKey(r.vehicle_key);
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                              showToast(`Loaded ${r.vehicle_name} into Fare Simulator`, 'info');
                            }}
                            title="Simulate in Calculator"
                            style={{
                              padding: '7px 9px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              borderRadius: '7px',
                              color: '#60A5FA',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <Calculator size={14} />
                            <span>Simulate</span>
                          </button>

                          <button
                            onClick={() => handleOpenModal(r)}
                            title="Edit Rate Card"
                            style={{
                              padding: '7px 9px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '7px',
                              color: '#CBD5E1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => confirmDelete(r)}
                            title="Delete Rate Card"
                            style={{
                              padding: '7px 9px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '7px',
                              color: '#FCA5A5',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingRule ? `Edit Pricing Rule: ${editingRule.vehicle_name}` : 'Add Vehicle Rate Card'
        }
        maxWidth="680px"
      >
        <form
          onSubmit={handleSave}
          style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
        >
          {/* Vehicle Key & Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Vehicle Key Identifier *
              </label>
              <input
                type="text"
                required
                disabled={Boolean(editingRule)}
                value={vehicleKey}
                onChange={e => setVehicleKey(e.target.value.toLowerCase().trim())}
                placeholder="e.g. dzire, ertiga, innova"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: editingRule ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: editingRule ? '#94A3B8' : '#60A5FA',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  marginTop: '2px',
                  display: 'block',
                }}
              >
                Used in dispatch bookings & API lookups
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Display Vehicle Name *
              </label>
              <input
                type="text"
                required
                value={vehicleName}
                onChange={e => setVehicleName(e.target.value)}
                placeholder="e.g. Swift Dzire (Sedan)"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Slabs & Allowances Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                Per-KM Rate (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={perKm}
                onChange={e => setPerKm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#60A5FA',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                Base billing rate / km
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                Min Billed Distance (KM) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={minKm}
                onChange={e => setMinKm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                Per trip minimum (e.g. 130 km)
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                Driver Allowance / Day (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={driverAllowance}
                onChange={e => setDriverAllowance(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                Driver bata / night halt
              </span>
            </div>
          </div>

          {/* Flat Route Packages */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                One-Way Pune-Mum (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={onewayPuneMumbai}
                onChange={e => setOnewayPuneMumbai(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#10B981',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                Flat highway package
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                Round-Trip Base (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={roundtripBase}
                onChange={e => setRoundtripBase(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                Same-day return base
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#CBD5E1',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                Airport Rate (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={airportRate}
                onChange={e => setAirportRate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#93C5FD',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#64748B',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                BOM airport pickup/drop
              </span>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={showPricePublic === 1}
                onChange={e => setShowPricePublic(e.target.checked ? 1 : 0)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#3B82F6',
                  cursor: 'pointer',
                }}
              />
              <div>
                <span
                  style={{
                    color: showPricePublic === 1 ? '#34D399' : '#94A3B8',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {showPricePublic === 1
                    ? 'Publicly Visible (Displayed on Website Pricing Section)'
                    : 'Internal Only (Used for Dispatch Quotes & Dynamic Calculations)'}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: '#64748B',
                    marginTop: '2px',
                  }}
                >
                  Enable to highlight this vehicle card in customer-facing rate tables
                </span>
              </div>
            </label>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '8px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: '9px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '9px 22px',
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              {isSaving ? 'Saving...' : editingRule ? 'Update Pricing Rule' : 'Create Pricing Rule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete Rate Card"
        maxWidth="480px"
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h4 style={{ margin: '0 0 10px 0', color: '#F8FAFC', fontSize: '1.15rem' }}>
            Delete rate card for &quot;{ruleToDelete?.vehicle_name}&quot;?
          </h4>
          <p
            style={{
              margin: '0 0 20px 0',
              color: '#94A3B8',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete this pricing rule? Future automated booking estimates
            for this vehicle key will fallback to default rates.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
              style={{
                padding: '9px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '9px 22px',
                background: '#DC2626',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
