import { describe, it, expect } from 'vitest';
import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils.service.js';

describe('FirebaseFirestoreUtilsService.isDeepEqual', () => {
  it('returns true for deeply equal objects with different key order', () => {
    const left = {
      b: 2,
      a: 1,
      nested: {
        y: 'value',
        x: [1, 2, 3],
      },
    };

    const right = {
      a: 1,
      b: 2,
      nested: {
        x: [1, 2, 3],
        y: 'value',
      },
    };

    expect(FirebaseFirestoreUtilsService.isDeepEqual(left, right)).toBe(true);
  });

  it('returns false for objects with different nested values', () => {
    const left = {
      a: 1,
      nested: {
        count: 5,
      },
    };

    const right = {
      a: 1,
      nested: {
        count: 6,
      },
    };

    expect(FirebaseFirestoreUtilsService.isDeepEqual(left, right)).toBe(false);
  });
});
