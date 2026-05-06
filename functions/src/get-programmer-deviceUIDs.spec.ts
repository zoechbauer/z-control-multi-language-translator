import { describe, it, beforeEach, vi, expect } from 'vitest';

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

import { getProgrammerDeviceUIDs } from './get-programmer-deviceUIDs.js';
import { FirebaseFirestoreService } from './firebase-firestore.service.js';

describe('getProgrammerDeviceUIDs', () => {
  const makeRequest = (uid?: string) => ({
    auth: uid ? { uid } : undefined,
  });

  beforeEach(() => {
    vi.mocked(FirebaseFirestoreService).mockReset();
  });

  it('should throw unauthenticated HttpsError if request has no auth', async () => {
    const request = makeRequest(); // { auth: undefined }
    const call = (getProgrammerDeviceUIDs as any)(request); // invoke the raw handler → returns a Promise
    const expected = {
      code: 'unauthenticated',
      message: 'User must be authenticated.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should return { programmerDevices: [...] } when firestoreService returns a list of programmer device UIDs', async () => {
    const mockProgrammerDevices = [
      {
        deviceUID: 'device1',
        deviceInfo: { model: 'Model A', platform: 'iOS' },
      },
      {
        deviceUID: 'device2',
        deviceInfo: { model: 'Model B', platform: 'Android' },
      },
    ];
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.getProgrammerDeviceUIDs = vi
        .fn()
        .mockResolvedValue(mockProgrammerDevices);
    } as any);

    const request = makeRequest('user1');
    const call = (getProgrammerDeviceUIDs as any)(request);
    const expected = { programmerDevices: mockProgrammerDevices };
    await expect(call).resolves.toMatchObject(expected);
  });

  it('should throw internal HttpsError if firestoreService.getProgrammerDeviceUIDs throws an error', async () => {
    const error = new Error('Some error');
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.getProgrammerDeviceUIDs = vi.fn().mockRejectedValue(error);
    } as any);

    const request = makeRequest('user1');
    const call = (getProgrammerDeviceUIDs as any)(request);
    const expected = {
      code: 'internal',
      message: 'Some error',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw internal HttpsError with default message if firestoreService.getProgrammerDeviceUIDs throws an error without a message', async () => {
    const error = new Error();
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.getProgrammerDeviceUIDs = vi.fn().mockRejectedValue(error);
    } as any);

    const request = makeRequest('user1');
    const call = (getProgrammerDeviceUIDs as any)(request);
    const expected = {
      code: 'internal',
      message: 'Error retrieving programmer device UIDs.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });
});
