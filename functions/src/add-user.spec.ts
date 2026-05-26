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

import { addUser } from './add-user.js';
import { FirebaseFirestoreService } from './firebase-firestore.service.js';
import {
  DeviceInfo,
  ProgrammerDeviceUID,
} from './shared/firebase-firestore.interfaces.js';

describe('addUser', () => {
  let deviceInfo: DeviceInfo;
  let programmerDeviceUIDs: ProgrammerDeviceUID[];

  const appId = 'translator';
  const makeRequest = (uid?: string, appId?: string) => ({
    auth: uid ? { uid } : undefined,
    data: appId !== undefined ? { appId } : undefined,
  });

  beforeEach(() => {
    vi.mocked(FirebaseFirestoreService).mockReset();

    deviceInfo = {
      userAgent: 'Mozilla/5.0',
      platform: 'native',
      language: 'en-US',
      appVersion: {
        major: 1,
        minor: 0,
        date: '2024-06-01',
      },
    };

    programmerDeviceUIDs = [{ userId: 'user1', name: 'Device 1' }];
  });

  it('should throw unauthenticated HttpsError if request has no auth', async () => {
    const request = makeRequest(); // { auth: undefined }
    const call = (addUser as any)(request); // invoke the raw handler → returns a Promise

    const expected = {
      code: 'unauthenticated',
      message: 'User must be authenticated.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw invalid-argument HttpsError if appId is missing', async () => {
    const request = {
      ...makeRequest('user1'),
      data: {
        programmerDeviceUIDs,
        deviceInfo,
        isNative: true,
      },
    };
    const call = (addUser as any)(request);
    const expected = {
      code: 'invalid-argument',
      message: 'appId must be provided.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw internal HttpsError if wrong appId is provided', async () => {
    const request = {
      ...makeRequest('user1'),
      data: {
        appId: 'wrongAppId',
        programmerDeviceUIDs,
        deviceInfo,
      },
    };
    const call = (addUser as any)(request);
    const expected = {
      code: 'internal',
      message: 'Unsupported appId: wrongAppId',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw invalid argument HttpsError if data is missing', async () => {
    const request = {
      ...makeRequest('user1'),
      data: undefined
    };
    const call = (addUser as any)(request);

    const expected = {
      code: 'invalid-argument',
      message: 'Request data is empty.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw invalid argument HttpsError if programmerDeviceUIDs is not an array', async () => {
    const request = {
      ...makeRequest('user1'),
      data: {
        appId,
        programmerDeviceUIDs: 'not-an-array',
        deviceInfo,
        isNative: true,
      },
    };
    const call = (addUser as any)(request);

    const expected = {
      code: 'invalid-argument',
      message: 'programmerDeviceUIDs must be an array.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw invalid argument HttpsError if any device in programmerDeviceUIDs is missing userId or name', async () => {
    const invalidProgrammerDevices = [
      { userId: 'user1', name: 'Device 1' },
      { userId: 'user2' }, // missing name
      { name: 'Device 3' }, // missing userId
      'invalid-device', // not an object
    ];
    programmerDeviceUIDs = [
      ...programmerDeviceUIDs,
      ...invalidProgrammerDevices,
    ] as any;
    const request = {
      ...makeRequest('user1'),
      data: {
        appId,
        programmerDeviceUIDs,
        deviceInfo,
        isNative: false,
      },
    };
    const call = (addUser as any)(request);

    const expected = {
      code: 'invalid-argument',
      message: 'Each device must have userId and name.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should throw invalid argument HttpsError if deviceInfo is missing', async () => {
    const request = {
      ...makeRequest('user1'),
      data: {
        appId,
        programmerDeviceUIDs,
        isNative: true,
      },
    };
    const call = (addUser as any)(request);

    const expected = {
      code: 'invalid-argument',
      message: 'deviceInfo is empty.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should return { success: true } when firestoreService adds user successfully', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.addUser = vi.fn().mockResolvedValue(undefined);
    } as any);
    const request = {
      ...makeRequest('user1'),
      data: {
        appId,
        programmerDeviceUIDs,
        deviceInfo,
      },
    };

    const result = await (addUser as any)(request);
    expect(result).toEqual({ success: true });
  });

  it('should throw internal HttpsError if firestoreService.addUser throws an error', async () => {
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.addUser = vi.fn().mockRejectedValue(new Error('Some error'));
    } as any);
    const request = {
      ...makeRequest('user1'),
      data: {
        appId,
        programmerDeviceUIDs,
        deviceInfo,
      },
    };
    const call = (addUser as any)(request);

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
      this.addUser = vi.fn().mockRejectedValue(new Error());
    } as any);
    const request = {
      ...makeRequest('user1'),
      data: {
        appId,
        programmerDeviceUIDs,
        deviceInfo,
      },
    };
    const call = (addUser as any)(request);

    const expected = {
      code: 'internal',
      message: 'Error adding user.',
    };
    await expect(call).rejects.toMatchObject(expected);
  });

  it('should log the error when firestoreService.addUser throws an error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    vi.mocked(FirebaseFirestoreService).mockImplementation(function (
      this: any
    ) {
      this.addUser = vi.fn().mockRejectedValue(new Error('Some error'));
    } as any);
    const request = {
      ...makeRequest('user1'),
      data: {
        appId,
        programmerDeviceUIDs,
        deviceInfo,
      },
    };
    const call = (addUser as any)(request);

    await expect(call).rejects.toMatchObject({
      code: 'internal',
      message: 'Some error',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error adding user.',
      new Error('Some error'),
    );
    consoleErrorSpy.mockRestore();
  });
});
