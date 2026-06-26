import { describe, it, expect } from 'vitest';
import { omitUndefinedFields } from './firestore';

describe('omitUndefinedFields', () => {
  it('removes undefined values before Firestore write', () => {
    const result = omitUndefinedFields({
      userId: 'abc',
      clientName: 'Juan',
      clientPhone: undefined,
      notes: undefined,
      status: 'pending',
    });

    expect(result).toEqual({
      userId: 'abc',
      clientName: 'Juan',
      status: 'pending',
    });
    expect('clientPhone' in result).toBe(false);
    expect('notes' in result).toBe(false);
  });
});
