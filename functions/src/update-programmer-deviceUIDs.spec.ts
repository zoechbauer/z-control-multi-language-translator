import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import { updateProgrammerDeviceUIDs } from './update-programmer-deviceUIDs.js';
import { FirebaseFirestoreService } from './firebase-firestore.service.js';

describe('updateProgrammerDeviceUIDs', () => {
  const makeRequest = (uid?: string) => ({
    auth: uid ? { uid } : undefined,
  });

  beforeEach(() => {
    vi.mocked(FirebaseFirestoreService).mockReset();
  });

  it('should throw unauthenticated HttpsError if request has no auth', async () => {
    const request = makeRequest(); // { auth: undefined }
    const call = (updateProgrammerDeviceUIDs as any)(request); // invoke the raw handler → returns a Promise
    const expected = {
      code: 'unauthenticated',
      message: 'User must be authenticated.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw invalid argument HttpsError if programmerDeviceUIDs is not an array', async () => {
    const request = {
      ...makeRequest('user1'),
      data: { programmerDeviceUIDs: 'not-an-array' },
    };
    const call = (updateProgrammerDeviceUIDs as any)(request);
    const expected = {
      code: 'invalid-argument',
      message: 'programmerDeviceUIDs must be an array.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw invalid argument HttpsError if any device in programmerDeviceUIDs is missing userId or name', async () => {
    const programmerDeviceUIDs = [
      { userId: 'user1', name: 'Device 1' },
      { userId: 'user2' }, // missing name
      { name: 'Device 3' }, // missing userId
      'invalid-device', // not an object
    ];
    const request = {
      ...makeRequest('user1'),
      data: { programmerDeviceUIDs },
    };
    const call = (updateProgrammerDeviceUIDs as any)(request);
    const expected = {
      code: 'invalid-argument',
      message: 'Each device must have userId and name.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should return { success: true } when firestoreService updates programmer device UIDs successfully', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.updateProgrammerDeviceUIDs = vi.fn().mockResolvedValue(undefined);
    } as any);
    const request = {
      ...makeRequest('user1'),
      data: { programmerDeviceUIDs: [{ userId: 'user1', name: 'Device 1' }] },
    };
    const call = (updateProgrammerDeviceUIDs as any)(request);
    const expected = { success: true };
    await expect(call).resolves.toEqual(expected);
  });

  it('should throw internal HttpsError if firestoreService.updateProgrammerDeviceUIDs throws an error', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.updateProgrammerDeviceUIDs = vi
        .fn()
        .mockRejectedValue(new Error('Some error'));
    } as any);

    const request = {
      ...makeRequest('user1'),
      data: { programmerDeviceUIDs: [{ userId: 'user1', name: 'Device 1' }] },
    };
    const call = (updateProgrammerDeviceUIDs as any)(request);
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
      this.updateProgrammerDeviceUIDs = vi.fn().mockRejectedValue(new Error());
    } as any);

    const request = {
      ...makeRequest('user1'),
      data: { programmerDeviceUIDs: [{ userId: 'user1', name: 'Device 1' }] },
    };
    const call = (updateProgrammerDeviceUIDs as any)(request);
    const expected = {
      code: 'internal',
      message: 'Error updating programmer device UIDs.',
    };

    await expect(call).rejects.toMatchObject(expected);
  });
});
