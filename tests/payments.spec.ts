import { describe, it, expect } from 'vitest';

describe('payments basic', () => {
  it('computes outstanding as billed - paid (client calc example)', () => {
    const ledger = [
      { entry_type: 'Bill', amount: 90000 },
      { entry_type: 'Payment', amount: 60000 },
      { entry_type: 'Adjustment', amount: -0 },
    ] as any[];
    const billed = ledger.filter(r => r.entry_type === 'Bill' || r.entry_type === 'CarryForward').reduce((s, r) => s + Number(r.amount || 0), 0);
    const paid = ledger.filter(r => r.entry_type === 'Payment').reduce((s, r) => s + Number(r.amount || 0), 0);
    const outstanding = Math.max(billed - paid, 0);
    expect(billed).toBe(90000);
    expect(paid).toBe(60000);
    expect(outstanding).toBe(30000);
  });
});








