import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock() must be called at the top level, not inside a test or beforeEach block
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

import { createMissingContingentData } from './create-missing-contingent-data.js';
import { FirebaseFirestoreService } from './firebase-firestore.service.js';

describe('createMissingContingentData', () => {
  const makeRequest = (uid?: string) => ({
    auth: uid ? { uid } : undefined,
  });

  beforeEach(() => {
    vi.mocked(FirebaseFirestoreService).mockReset();
  });

  it('should throw unauthenticated HttpsError if request has no auth', async () => {
    const request = makeRequest(); // { auth: undefined }
    const call = (createMissingContingentData as any)(request); // invoke the raw handler → returns a Promise
    const expected = {
      code: 'unauthenticated',
      message: 'User must be authenticated.',
    };

    await expect(call).rejects.toMatchObject(expected);
  });

  it('should return { success: true } when firestoreService creates missing contingent data successfully', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.createMissingContingentData = vi.fn().mockResolvedValue(undefined);
    } as any);

    const result = await (createMissingContingentData as any)(
      makeRequest('user1')
    );
    expect(result).toEqual({ success: true });
  });

  it('should throw internal HttpsError if firestoreService.createMissingContingentData throws an error', async () => {
    const error = new Error('Some error');
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.createMissingContingentData = vi.fn().mockRejectedValue(error);
    } as any);

    const call = (createMissingContingentData as any)(makeRequest('user1'));
    const expected = {
      code: 'internal',
      message: 'Some error',
    };

    await expect(call).rejects.toMatchObject(expected);
  });
  it('should throw internal HttpsError with default message if thrown error has no message', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.createMissingContingentData = vi.fn().mockRejectedValue({});
    } as any);

    const call = (createMissingContingentData as any)(makeRequest('user1'));
    const expected = {
      code: 'internal',
      message: 'Error creating missing contingent data.',
    };

    await expect(call).rejects.toMatchObject(expected);
  });
});
