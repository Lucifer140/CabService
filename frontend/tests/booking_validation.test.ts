import { describe, it, expect } from 'vitest';

// Validation helpers
export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(clean);
}

export function validateDates(travelDate: string, returnDate?: string, tripType?: string): { valid: boolean; error?: string } {
  const today = new Date().toISOString().split('T')[0];
  if (!travelDate) return { valid: false, error: 'Travel date is required' };
  if (travelDate < today) return { valid: false, error: 'Travel date cannot be in the past' };

  if (tripType === 'roundtrip') {
    if (!returnDate) return { valid: false, error: 'Return date is required for round trips' };
    if (returnDate < travelDate) return { valid: false, error: 'Return date cannot precede travel date' };
  }

  return { valid: true };
}

export function estimateFare(tripType: string, basePrice: number, perKm: number, distanceKm: number = 152): number {
  if (tripType === 'roundtrip') {
    return Math.max(basePrice * 1.8, Math.round(distanceKm * 2 * perKm * 0.95));
  }
  return basePrice || Math.round(distanceKm * perKm);
}

describe('Booking Form Validation Suite', () => {
  it('validates 10-digit Indian mobile numbers correctly', () => {
    expect(validatePhone('9822012345')).toBe(true);
    expect(validatePhone('8261021008')).toBe(true);
    expect(validatePhone('7028123456')).toBe(true);
    expect(validatePhone('6354123456')).toBe(true);

    // Invalid numbers
    expect(validatePhone('1234567890')).toBe(false); // Does not start with 6-9
    expect(validatePhone('982201234')).toBe(false);  // 9 digits
    expect(validatePhone('98220123456')).toBe(false); // 11 digits
    expect(validatePhone('abcd982201')).toBe(false);
  });

  it('validates travel dates and prevents past bookings', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    expect(validateDates(yesterday).valid).toBe(false);
    expect(validateDates(tomorrow).valid).toBe(true);
  });

  it('validates roundtrip return date constraints', () => {
    const travel = '2026-11-01';
    const returnEarly = '2026-10-31';
    const returnValid = '2026-11-03';

    expect(validateDates(travel, '', 'roundtrip').valid).toBe(false);
    expect(validateDates(travel, returnEarly, 'roundtrip').valid).toBe(false);
    expect(validateDates(travel, returnValid, 'roundtrip').valid).toBe(true);
  });

  it('calculates dynamic fare estimates accurately', () => {
    const dzireBase = 2299;
    const dzirePerKm = 12;

    const onewayFare = estimateFare('oneway', dzireBase, dzirePerKm, 152);
    expect(onewayFare).toBe(2299);

    const roundtripFare = estimateFare('roundtrip', dzireBase, dzirePerKm, 152);
    expect(roundtripFare).toBeGreaterThan(onewayFare);
  });
});
