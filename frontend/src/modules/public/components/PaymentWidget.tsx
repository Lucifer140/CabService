import React, { useState } from 'react';
import { api } from '../../../services/api';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  Clock,
  X,
  AlertCircle,
} from 'lucide-react';

interface PaymentWidgetProps {
  bookingId: number;
  bookingRef: string;
  totalFare: number;
  customerName?: string;
  customerPhone?: string;
  onPaymentComplete?: (paymentId: string) => void;
  onClose?: () => void;
}

export const PaymentWidget: React.FC<PaymentWidgetProps> = ({
  bookingId,
  bookingRef,
  totalFare,
  customerName = 'Passenger',
  customerPhone = '',
  onPaymentComplete,
  onClose,
}) => {
  const [paymentType, setPaymentType] = useState<'ADVANCE' | 'FULL'>('ADVANCE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedPayment, setCompletedPayment] = useState<{
    paymentId: string;
    amount: number;
    type: string;
  } | null>(null);

  const payableAmount = paymentType === 'ADVANCE' ? 500 : totalFare;

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create Order on Backend
      const orderRes = await api.post<{
        success: boolean;
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
        simulated: boolean;
      }>('/api/payments/create-order', {
        booking_id: bookingId,
        booking_ref: bookingRef,
        payment_type: paymentType,
      });

      if (!orderRes.success || !orderRes.order_id) {
        throw new Error('Failed to initiate payment gateway order.');
      }

      // 2. Razorpay Live Checkout or Sandbox Simulation
      if (typeof window !== 'undefined' && (window as any).Razorpay && !orderRes.simulated) {
        const options = {
          key: orderRes.key_id,
          amount: orderRes.amount * 100,
          currency: orderRes.currency,
          name: 'Sangita Travels Pune',
          description: `${paymentType === 'ADVANCE' ? '₹500 Token Advance' : 'Full Fare'} - ${bookingRef}`,
          order_id: orderRes.order_id,
          prefill: {
            name: customerName,
            contact: customerPhone,
          },
          theme: {
            color: '#2563EB',
          },
          handler: async function (response: any) {
            await verifyOnServer(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Safe sandbox simulation (auto-approves test payment for demo/test environments)
        const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 10)}`;
        const mockSignature = `sig_${Math.random().toString(36).substring(2, 14)}`;
        await verifyOnServer(orderRes.order_id, mockPaymentId, mockSignature);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed. Please try again or pay cash to driver.');
      setIsProcessing(false);
    }
  };

  const verifyOnServer = async (orderId: string, paymentId: string, signature: string) => {
    try {
      const verifyRes = await api.post<{
        success: boolean;
        payment_id: string;
        amount: number;
        payment_type: string;
      }>('/api/payments/verify', {
        order_id: orderId,
        payment_id: paymentId,
        signature: signature,
      });

      if (verifyRes.success) {
        setCompletedPayment({
          paymentId: verifyRes.payment_id,
          amount: verifyRes.amount,
          type: verifyRes.payment_type,
        });
        if (onPaymentComplete) {
          onPaymentComplete(verifyRes.payment_id);
        }
      } else {
        throw new Error('Payment verification rejected by server.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '520px',
        margin: '20px auto 0',
        color: '#F8FAFC',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        position: 'relative',
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>
      )}

      {completedPayment ? (
        /* Payment Success View */
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#10B981',
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#F8FAFC' }}>
            Payment Verified!
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '0 0 20px' }}>
            Booking <strong>{bookingRef}</strong> confirmed with verified online receipt.
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'left',
              fontSize: '0.85rem',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>Transaction ID:</span>
              <strong style={{ color: '#60A5FA', fontFamily: 'monospace' }}>
                {completedPayment.paymentId}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94A3B8' }}>Amount Paid:</span>
              <strong style={{ color: '#10B981' }}>₹{completedPayment.amount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94A3B8' }}>Remaining Due:</span>
              <strong style={{ color: '#F8FAFC' }}>
                ₹{Math.max(0, totalFare - completedPayment.amount)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a
              href={`/api/public/bookings/${bookingId}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              <Printer size={16} /> Print Official Invoice
            </a>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Payment Selection View */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60A5FA',
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Confirm Ride Deposit</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                Booking Ref: <strong style={{ color: '#F8FAFC' }}>{bookingRef}</strong>
              </p>
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Type Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div
              onClick={() => setPaymentType('ADVANCE')}
              style={{
                padding: '14px',
                borderRadius: '14px',
                border: `2px solid ${paymentType === 'ADVANCE' ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)'}`,
                background: paymentType === 'ADVANCE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkles size={14} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '0.78rem', color: '#F59E0B', fontWeight: 700 }}>POPULAR</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>₹500</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                Token Advance (Guarantees cab dispatch)
              </div>
            </div>

            <div
              onClick={() => setPaymentType('FULL')}
              style={{
                padding: '14px',
                borderRadius: '14px',
                border: `2px solid ${paymentType === 'FULL' ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)'}`,
                background: paymentType === 'FULL' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <ShieldCheck size={14} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>FULL FARE</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC' }}>₹{totalFare}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                100% Pre-paid (Zero hassle at destination)
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              fontSize: '0.78rem',
              color: '#94A3B8',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock size={16} style={{ color: '#60A5FA', flexShrink: 0 }} />
            <span>
              Supported payment methods: <strong>UPI (GPay, PhonePe, Paytm)</strong>, NetBanking, Debit & Credit Cards.
            </span>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleInitiatePayment}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
              opacity: isProcessing ? 0.7 : 1,
            }}
          >
            <span>{isProcessing ? 'Connecting Gateway...' : `Proceed with ₹${payableAmount}`}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
