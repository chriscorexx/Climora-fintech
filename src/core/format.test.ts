import { describe, it, expect } from 'vitest';
import {
  formatCompactInr,
  formatCompactNumber,
  formatCrore,
  formatDate,
  formatDateTime,
  formatLakhs,
  formatMonths,
  formatRatio,
} from './format';

describe('Format helpers', () => {
  it('formats INR into lakh and crore scales', () => {
    expect(formatCompactInr(2500000)).toBe('₹25.0 Lakh');
    expect(formatCompactInr(25000000)).toBe('₹2.50 Cr');
    expect(formatCompactInr(850000)).toBe('₹8.5 Lakh');
    expect(formatCompactInr(4500)).toBe('₹4.5K');
    expect(formatCompactInr(500)).toBe('₹500');
    expect(formatCompactInr(undefined)).toBe('₹0');

    expect(formatLakhs(2500000)).toBe('₹25.0 Lakh');
    expect(formatCrore(25000000)).toBe('₹2.50 Cr');
  });

  it('formats compact counts', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(250000)).toBe('2.5L');
    expect(formatCompactNumber(30000000)).toBe('3.00Cr');
    expect(formatCompactNumber(42)).toBe('42');
  });

  it('formats months and ratios', () => {
    expect(formatMonths(2.53)).toBe('2.5 months');
    expect(formatRatio(1.234)).toBe('1.23x');
  });

  it('formats dates and tolerates invalid input', () => {
    expect(formatDate('2026-10-09T14:30:00.000Z')).toMatch(/2026/);
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDateTime('not-a-date')).toBe('—');
  });
});
