import { describe, it, beforeEach, expect, vi } from 'vitest';

// vi.mock calls are hoisted — must appear before imports
vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((handler: any) => handler),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

vi.mock('./firebase-firestore.service.js', () => ({
  FirebaseFirestoreService: vi.fn(),
}));

import { isProgrammerDevice } from './is-programmer-device.js';
import { FirebaseFirestoreService } from './firebase-firestore.service.js';

describe('isProgrammerDevice', () => {
  const makeRequest = (uid?: string) => ({
    auth: uid ? { uid } : undefined,
  });

  beforeEach(() => {
    vi.mocked(FirebaseFirestoreService).mockReset();
  });

  it('should throw unauthenticated HttpsError if request has no auth', async () => {
    const request = makeRequest(); // { auth: undefined }
    const call = (isProgrammerDevice as any)(request); // invoke the raw handler → returns a Promise
    const expected = {
      code: 'unauthenticated',
      message: 'User must be authenticated.',
    };

    await expect(call).rejects.toMatchObject(expected);
  });

  it('should return { isProgrammerDevice: true } when firestoreService returns true', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.isProgrammerDevice = vi.fn().mockResolvedValue(true);
    } as any);

    const result = await (isProgrammerDevice as any)(makeRequest('user1'));
    expect(result).toEqual({ isProgrammerDevice: true });
  });

  it('should return { isProgrammerDevice: false } when firestoreService returns false', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.isProgrammerDevice = vi.fn().mockResolvedValue(false);
    } as any);

    const result = await (isProgrammerDevice as any)(makeRequest('user1'));
    expect(result).toEqual({ isProgrammerDevice: false });
  });

  it('should throw internal HttpsError with the error message if firestoreService throws', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.isProgrammerDevice = vi
        .fn()
        .mockRejectedValue(new Error('DB error'));
    } as any);

    await expect(
      (isProgrammerDevice as any)(makeRequest('user1'))
    ).rejects.toMatchObject({
      code: 'internal',
      message: 'DB error',
    });
  });

  it('should throw internal HttpsError with default message if thrown error has no message', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.isProgrammerDevice = vi.fn().mockRejectedValue({});
    } as any);

    await expect(
      (isProgrammerDevice as any)(makeRequest('user1'))
    ).rejects.toMatchObject({
      code: 'internal',
      message: 'Error checking if device is a programmer device.',
    });
  });
});
