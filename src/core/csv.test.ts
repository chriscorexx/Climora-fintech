import { describe, it, expect } from 'vitest';
import { toCsv } from './csv';

describe('CSV builder', () => {
  it('joins headers and rows with commas', () => {
    expect(toCsv(['A', 'B'], [[1, 2]])).toBe('A,B\n1,2');
  });

  it('quotes values containing commas, quotes, or newlines', () => {
    const csv = toCsv(['Enterprise', 'City'], [['Agro, Seeds', 'P"une']]);
    expect(csv).toBe('Enterprise,City\n"Agro, Seeds","P""une"');
  });

  it('renders nullish values as empty strings', () => {
    expect(toCsv(['A'], [[null as unknown as string]])).toBe('A\n');
    expect(toCsv(['A'], [[undefined as unknown as string]])).toBe('A\n');
  });
});
