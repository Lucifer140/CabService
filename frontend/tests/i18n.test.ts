import { describe, it, expect } from 'vitest';
import { en } from '../src/i18n/translations/en';
import { mr } from '../src/i18n/translations/mr';
import { hi } from '../src/i18n/translations/hi';

describe('Multi-Language i18n Suite (Phase 35)', () => {
  it('contains matching translation keys across English, Marathi, and Hindi', () => {
    const enKeys = Object.keys(en).sort();
    const mrKeys = Object.keys(mr).sort();
    const hiKeys = Object.keys(hi).sort();

    expect(enKeys).toEqual(mrKeys);
    expect(enKeys).toEqual(hiKeys);
    expect(enKeys.length).toBeGreaterThanOrEqual(40);
  });

  it('has non-empty translations for all core booking keys in all languages', () => {
    const coreKeys = [
      'nav_book_ride',
      'nav_track_ride',
      'hero_title_prefix',
      'tab_oneway',
      'tab_roundtrip',
      'lbl_pickup',
      'lbl_drop',
      'btn_confirm_booking',
      'footer_tagline',
    ] as const;

    for (const key of coreKeys) {
      expect(en[key]).toBeTruthy();
      expect(mr[key]).toBeTruthy();
      expect(hi[key]).toBeTruthy();

      // Verify Marathi contains Devanagari characters
      expect(/[\u0900-\u097F]/.test(mr[key])).toBe(true);
      // Verify Hindi contains Devanagari characters
      expect(/[\u0900-\u097F]/.test(hi[key])).toBe(true);
    }
  });

  it('correctly provides authentic Marathi and Hindi booking tab labels', () => {
    expect(mr.tab_oneway).toContain('वन-वे');
    expect(hi.tab_oneway).toContain('वन-वे');
    expect(mr.tab_roundtrip).toContain('राऊंड ट्रिप');
    expect(hi.tab_roundtrip).toContain('राउंड ट्रिप');
  });
});
