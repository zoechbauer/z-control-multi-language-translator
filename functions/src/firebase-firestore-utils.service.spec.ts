import { beforeEach, describe, it, expect, vi } from 'vitest';

// Mock the entire FirebaseFirestoreService module because of static validateContingentOrThrow
vi.mock('./firebase-firestore.service.js', () => ({
  FirebaseFirestoreService: vi.fn(),
}));

import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils.service.js';
import { FirestoreContingentData } from './shared/firebase-firestore.interfaces.js';
import { FirebaseFirestoreService } from './firebase-firestore.service.js';

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

describe('isContingentExceeded', () => {
  it('returns true if StopTranslationForAllUsers is set', async () => {
    const service = new FirebaseFirestoreUtilsService({} as any);
    const result = await service.isContingentExceeded(
      { StopTranslationForAllUsers: true } as any,
      'userId'
    );
    expect(result).toBe(true);
  });

  it('returns true if total contingent is exceeded', async () => {
    const service = new FirebaseFirestoreUtilsService({} as any);
    const isTotalContingentExceededSpy = vi
      .spyOn(service as any, 'isTotalContingentExceeded')
      .mockResolvedValue(true);

    const result = await service.isContingentExceeded(
      { StopTranslationForAllUsers: false } as any,
      'userId'
    );

    expect(isTotalContingentExceededSpy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns true if contingent for user is exceeded', async () => {
    const service = new FirebaseFirestoreUtilsService({} as any);
    const isTotalContingentExceededSpy = vi
      .spyOn(service as any, 'isTotalContingentExceeded')
      .mockResolvedValue(false);
    const isContingentForUserExceededSpy = vi
      .spyOn(service as any, 'isContingentForUserExceeded')
      .mockResolvedValue(true);

    const result = await service.isContingentExceeded(
      { StopTranslationForAllUsers: false } as any,
      'userId'
    );

    expect(isTotalContingentExceededSpy).toHaveBeenCalled();
    expect(isContingentForUserExceededSpy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns false if all checks fail', async () => {
    const service = new FirebaseFirestoreUtilsService({} as any);
    const isTotalContingentExceededSpy = vi
      .spyOn(service as any, 'isTotalContingentExceeded')
      .mockResolvedValue(false);
    const isContingentForUserExceededSpy = vi
      .spyOn(service as any, 'isContingentForUserExceeded')
      .mockResolvedValue(false);

    const result = await service.isContingentExceeded(
      { StopTranslationForAllUsers: false } as any,
      'userId'
    );

    expect(isTotalContingentExceededSpy).toHaveBeenCalled();
    expect(isContingentForUserExceededSpy).toHaveBeenCalled();
    expect(result).toBe(false);
  });
});

describe('isTotalContingentExceeded', () => {
  const firestoreContingentData: FirestoreContingentData = {
    StopTranslationForAllUsers: false,
    maxFreeTranslateCharsPerMonth: 500_000,
    maxFreeTranslateCharsBufferPerMonth: 5_000,
    maxFreeTranslateCharsPerMonthForUser: 10_000,
  };

  it('returns true if total contingent limit is missing (undefined guard)', async () => {
    const firestoreServiceMock = {
      getTotalCharCount: async () => 0,
    };
    const service = new FirebaseFirestoreUtilsService(
      firestoreServiceMock as any
    );
    const result = await (service as any).isTotalContingentExceeded({
      StopTranslationForAllUsers: false,
    } as any);
    expect(result).toBe(true);
  });

  it('returns true if total char count exceeds limit minus buffer', async () => {
    const firestoreServiceMock = {
      getTotalCharCount: async () => 495_000,
    };
    const service = new FirebaseFirestoreUtilsService(
      firestoreServiceMock as any
    );
    const result = await (service as any).isTotalContingentExceeded(
      firestoreContingentData
    );

    expect(result).toBe(true); // 495_000 >= 500_000 - 5_000
  });

  it('returns false if total char count is within limit minus buffer', async () => {
    const firestoreServiceMock = {
      getTotalCharCount: async () => 494_000, // below 495_000
    };
    const service = new FirebaseFirestoreUtilsService(
      firestoreServiceMock as any
    );
    const result = await (service as any).isTotalContingentExceeded(
      firestoreContingentData
    );

    expect(result).toBe(false); // 494_000 < 495_000
  });
});

describe('isContingentForUserExceeded', () => {
  it('returns true if user char count exceeds per-user limit', async () => {
    const firestoreContingentData = {
      maxFreeTranslateCharsPerMonthForUser: 10_000,
    } as any;
    const firestoreServiceMock = {
      getCharCountForUser: async () => ({ charCount: 10_000 }),
    };
    const service = new FirebaseFirestoreUtilsService(
      firestoreServiceMock as any
    );
    const result = await (service as any).isContingentForUserExceeded(
      firestoreContingentData,
      'userId'
    );
    expect(result).toBe(true); // 10_000 >= 10_000
  });

  it('returns true if user contingent data is undefined', async () => {
    const firestoreContingentData = {};
    const firestoreServiceMock = {
      getCharCountForUser: async () => ({ charCount: 10_000 }),
    };
    const service = new FirebaseFirestoreUtilsService(
      firestoreServiceMock as any
    );
    const result = await (service as any).isContingentForUserExceeded(
      firestoreContingentData,
      'userId'
    );
    expect(result).toBe(true); // 10_000 >= 10_000
  });
});

describe('validateContingentOrThrow', () => {
  const userId = 'testUserId';
  const collection = 'testCollection';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs if firestore contingent data is not found', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.readContingentData = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ any: 'flags' });
      this.createMissingContingentData = vi.fn().mockResolvedValue(undefined);
      this.getCharCountForUser = vi.fn();
      this.getTotalCharCount = vi.fn();
    });

    vi.spyOn(
      FirebaseFirestoreUtilsService.prototype,
      'isContingentExceeded'
    ).mockResolvedValue(false);

    await expect(
      FirebaseFirestoreUtilsService.validateContingentOrThrow(userId, collection)
    ).resolves.toBeUndefined();

    expect(logSpy).toHaveBeenCalledWith(
      `Contingent data not found for user${userId} -> created`
    );
    expect(
      FirebaseFirestoreService as unknown as { mock: { instances: any[] } }
    ).toHaveBeenCalledWith(collection, userId);
  });

  it('throws if contingent is exceeded', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.readContingentData = vi.fn().mockResolvedValue({ any: 'flags' });
      this.createMissingContingentData = vi.fn();
      this.getCharCountForUser = vi.fn();
      this.getTotalCharCount = vi.fn();
    });

    vi.spyOn(
      FirebaseFirestoreUtilsService.prototype,
      'isContingentExceeded'
    ).mockResolvedValue(true);

    await expect(
      FirebaseFirestoreUtilsService.validateContingentOrThrow(collection, userId)
    ).rejects.toThrow('Translation contingent exceeded');
  }, 10000);

  it('resolves if contingent is not exceeded', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.readContingentData = vi.fn().mockResolvedValue({ any: 'flags' });
      this.createMissingContingentData = vi.fn();
      this.getCharCountForUser = vi.fn();
      this.getTotalCharCount = vi.fn();
    });

    vi.spyOn(
      FirebaseFirestoreUtilsService.prototype,
      'isContingentExceeded'
    ).mockResolvedValue(false);

    await expect(
      FirebaseFirestoreUtilsService.validateContingentOrThrow(collection, userId)
    ).resolves.toBeUndefined();
  });
});
