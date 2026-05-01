import { describe, it, beforeEach, expect } from 'vitest';
import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils.service.js';

describe('FirebaseFirestoreUtilsService.isDeepEqual', () => {
  let left: any;
  let right: any;

  beforeEach(() => {
    left = {
      a: 1,
      nested: {
        count: 5,
      },
    };
    right = {
      a: 1,
      nested: {
        count: 5,
      },
    };
  });

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
    right.nested.count = 10;
    expect(FirebaseFirestoreUtilsService.isDeepEqual(left, right)).toBe(false);
  });

  it('returns false if object is null', () => {
    right = null;
    expect(FirebaseFirestoreUtilsService.isDeepEqual(left, right)).toBe(false);
  });

  it('returns false if object have different length', () => {
    right = { a: 1 };
    expect(FirebaseFirestoreUtilsService.isDeepEqual(left, right)).toBe(false);
  });

  it('returns false if object have different keys', () => {
    right = {
      'a-different': 1,
      nested: {
        count: 5,
      },
    };
    expect(FirebaseFirestoreUtilsService.isDeepEqual(left, right)).toBe(false);
  });

  it('returns true for same object reference (fast path)', () => {
    const same = { a: 1, nested: { count: 5 } };
    expect(FirebaseFirestoreUtilsService.isDeepEqual(same, same)).toBe(true);
  });

  it('returns true for equal primitive values', () => {
    expect(FirebaseFirestoreUtilsService.isDeepEqual(5, 5)).toBe(true);
  });

  it('returns false for different primitive values', () => {
    expect(FirebaseFirestoreUtilsService.isDeepEqual(5, 6)).toBe(false);
  });
});
