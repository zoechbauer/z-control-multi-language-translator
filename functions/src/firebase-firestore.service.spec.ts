import { beforeEach, describe, it, expect, vi } from 'vitest';
import { FireStoreConstants, UserType } from './shared/app.constants.js';
import {
  DeviceInfo,
  ProgrammerDeviceUID,
} from './shared/firebase-firestore.interfaces.js';

describe('FirebaseFirestoreService', () => {
  let FirebaseFirestoreService: any;
  let mockIncrement: any;
  let collection: string;

  beforeEach(async () => {
    vi.resetModules();
    collection = 'testCollection';

    mockIncrement = vi.fn((n: number) => ({ __incrementBy: n }));

    vi.doMock('firebase-admin', () => {
      const firestore = vi.fn(() => ({}));
      (firestore as any).FieldValue = {
        increment: mockIncrement,
      };

      return {
        default: {
          firestore,
        },
      };
    });

    FirebaseFirestoreService = (await import('./firebase-firestore.service.js'))
      .FirebaseFirestoreService;
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(FirebaseFirestoreService).toBeDefined();
    });

    it('should create an instance with userId and collection', () => {
      const service = new FirebaseFirestoreService(collection, 'testUserId');
      expect(service).toBeInstanceOf(FirebaseFirestoreService);
      expect(service.userId).toBe('testUserId');
      expect(service.collection).toBe(collection);
    });

    it('should have all expected methods defined', () => {
      const service = new FirebaseFirestoreService('testUserId');
      expect(service.readContingentData).toBeDefined();
      expect(service.getCharCountForUser).toBeDefined();
      expect(service.getTotalCharCount).toBeDefined();
      expect(service.createMissingContingentData).toBeDefined();
      expect(service.updateProgrammerDeviceUIDs).toBeDefined();
      expect(service.getProgrammerDeviceUIDs).toBeDefined();
      expect(service.isProgrammerDevice).toBeDefined();
      expect(service.addUser).toBeDefined();
      expect(service.addTranslatedChars).toBeDefined();
    });
  });

  describe('readContingentData', () => {
    it('should return contingent data from current month for the user', async () => {
      const mockDocData = {
        StopTranslationForAllUsers: false,
        maxFreeTranslateCharsPerMonth: 500_000,
        maxFreeTranslateCharsBufferPerMonth: 5_000,
        maxFreeTranslateCharsPerMonthForUser: 10_000,
      };

      // Mock the Firestore db chain injected in the constructor
      const mockGet = vi.fn().mockResolvedValue({ data: () => mockDocData });
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });

      // Override vi.doMock before re-import, or inject directly on the instance:
      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const data = await service.readContingentData(); // calls REAL method

      expect(data, 'data').toEqual(mockDocData);
      expect(mockDoc, 'mockDoc current month').toHaveBeenCalledWith(
        FireStoreConstants.getMetaContingentDataDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalled();
    });

    it('should throw an error if readContingentData fails', async () => {
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error('Failed to read contingent data'));
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await expect(service.readContingentData()).rejects.toThrow(
        'Failed to read contingent data'
      );

      expect(mockDoc, 'mockDoc contingentData').toHaveBeenCalledWith(
        FireStoreConstants.getMetaContingentDataDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('getCharCountForUser', () => {
    it('should return char count and target languages for the user', async () => {
      const mockDocData = {
        charCount: 1234,
        targetLanguages: ['en', 'nl'],
      };
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockDocData,
      });
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const charCount = await service.getCharCountForUser();

      expect(charCount).toEqual(mockDocData);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.stringContaining('testUserId')
      );
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return empty array for targetLanguages values for the user if target languages do not exist', async () => {
      const mockDocData = {
        charCount: 1234,
      };
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockDocData,
      });
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };
      const expectedResult = {
        charCount: 1234,
        targetLanguages: [],
      };

      const charCount = await service.getCharCountForUser();

      expect(charCount).toEqual(expectedResult);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.stringContaining('testUserId')
      );
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return default values for the user if doc does not exist', async () => {
      const mockDocData = {
        charCount: 0,
        targetLanguages: [],
      };
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
        data: () => mockDocData,
      });
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const charCount = await service.getCharCountForUser();

      expect(charCount).toEqual(mockDocData);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.stringContaining('testUserId')
      );
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('getTotalCharCount', () => {
    it('should return total char count for all users', async () => {
      const mockDocData = { charCount: 56789 };
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => mockDocData,
      });
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const totalCharCount = await service.getTotalCharCount();

      expect(totalCharCount).toEqual(mockDocData.charCount);
      expect(mockDoc).toHaveBeenCalledWith(
        FireStoreConstants.getMetaTotalCharsDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return 0 if total char count doc does not exist', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      });
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const totalCharCount = await service.getTotalCharCount();

      expect(totalCharCount).toEqual(0);
      expect(mockDoc).toHaveBeenCalledWith(
        FireStoreConstants.getMetaTotalCharsDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalled();
    });

    it('should log and throw an error if getTotalCharCount fails', async () => {
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error('Failed to get total char count'));
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });
      const mockConsoleError = vi.spyOn(console, 'error');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await expect(service.getTotalCharCount()).rejects.toThrow(
        'Failed to get total char count'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error getting total char count:',
        expect.any(Error)
      );
      expect(mockDoc).toHaveBeenCalledWith(
        FireStoreConstants.getMetaTotalCharsDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('createMissingContingentData', () => {
    it('should create document and log if it does not exist', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await service.createMissingContingentData();

      expect(mockDoc).toHaveBeenCalledWith(
        FireStoreConstants.getMetaContingentDataDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ StopTranslationForAllUsers: false }),
        { merge: true }
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Created control flags document with default values.'
      );
    });

    it('should skip creating document if it already exists', async () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn().mockResolvedValue({ exists: true });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await service.createMissingContingentData();

      expect(mockDoc).toHaveBeenCalledWith(
        FireStoreConstants.getMetaContingentDataDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalledWith();
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should log and throw an error if get fails', async () => {
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error('Failed to check document existence'));
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });
      const mockConsoleError = vi.spyOn(console, 'error');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await expect(service.createMissingContingentData()).rejects.toThrow(
        'Failed to check document existence'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error creating missing contingent data:',
        expect.any(Error)
      );
      expect(mockDoc).toHaveBeenCalledWith(
        FireStoreConstants.getMetaContingentDataDocumentPath(collection)
      );
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('updateProgrammerDeviceUIDs', () => {
    let mockUpdateUserMappingUsers: any;
    let mockCreateUserMappingProgrammerDevices: any;

    beforeEach(() => {
      mockUpdateUserMappingUsers = vi.fn().mockResolvedValue(undefined);
      mockCreateUserMappingProgrammerDevices = vi
        .fn()
        .mockResolvedValue(undefined);
    });

    it('should throw a type error if programmerDeviceUIDs is not an array', async () => {
      const service = new FirebaseFirestoreService('testUserId');
      const invalidInput: any = 'not-an-array';
      await expect(
        service.updateProgrammerDeviceUIDs(invalidInput)
      ).rejects.toThrow('programmerDeviceUIDs must be an array');
    });

    it('should update user mapping users and create programmer devices', async () => {
      const service = new FirebaseFirestoreService('testUserId');
      (service as any).updateUserMappingUsers = mockUpdateUserMappingUsers;
      (service as any).createUserMappingProgrammerDevices =
        mockCreateUserMappingProgrammerDevices;

      const programmerDevices = [{ userId: 'user1', name: 'Device 1' }];
      await service.updateProgrammerDeviceUIDs(programmerDevices);

      expect(mockUpdateUserMappingUsers).toHaveBeenCalledWith(
        { userId: 'user1', name: 'Device 1' },
        programmerDevices
      );
      expect(mockCreateUserMappingProgrammerDevices).toHaveBeenCalledWith({
        userId: 'user1',
        name: 'Device 1',
      });
    });

    it('should skip and log invalid programmer devices', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const service = new FirebaseFirestoreService('testUserId');
      (service as any).updateUserMappingUsers = mockUpdateUserMappingUsers;
      (service as any).createUserMappingProgrammerDevices =
        mockCreateUserMappingProgrammerDevices;

      const programmerDevices = [
        { userId: 'user1', name: 'Device 1' },
        { name: 'Device 2' },
        { userId: 'user2' },
      ];
      await service.updateProgrammerDeviceUIDs(programmerDevices);

      // valid devices
      expect(mockUpdateUserMappingUsers).toHaveBeenCalledWith(
        { userId: 'user1', name: 'Device 1' },
        programmerDevices
      );
      expect(mockCreateUserMappingProgrammerDevices).toHaveBeenCalledWith({
        userId: 'user1',
        name: 'Device 1',
      });

      // invalid devices
      expect(mockUpdateUserMappingUsers).not.toHaveBeenCalledWith(
        { name: 'Device 2' },
        programmerDevices
      );
      expect(mockUpdateUserMappingUsers).not.toHaveBeenCalledWith(
        { userId: 'user2' },
        programmerDevices
      );

      expect(mockCreateUserMappingProgrammerDevices).not.toHaveBeenCalledWith({
        name: 'Device 2',
      });
      expect(mockCreateUserMappingProgrammerDevices).not.toHaveBeenCalledWith({
        userId: 'user2',
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Skipping device without userId or name:',
        { name: 'Device 2' }
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Skipping device without userId or name:',
        { userId: 'user2' }
      );
    });

    it('should log and throw an error if updateUserMappingUsers fails', async () => {
      const service = new FirebaseFirestoreService('testUserId');
      const error = new Error('Failed to update user mapping users');
      (service as any).updateUserMappingUsers = vi
        .fn()
        .mockRejectedValue(error);
      (service as any).createUserMappingProgrammerDevices =
        mockCreateUserMappingProgrammerDevices;
      const mockConsoleError = vi.spyOn(console, 'error');
      const programmerDevices = [{ userId: 'user1', name: 'Device 1' }];

      await service.updateProgrammerDeviceUIDs(programmerDevices);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error updating user mapping for programmer device:',
        { userId: 'user1', name: 'Device 1' },
        error
      );
    });
  });

  describe('updateUserMappingUsers', () => {
    let allDevices: any;

    beforeEach(() => {
      allDevices = [
        {
          userId: 'user1',
          name: 'U-1',
          device: 'Device 1',
          type: UserType.User,
        },
        {
          userId: 'user2',
          name: 'P-1',
          device: 'Device 2',
          type: UserType.Programmer,
        },
      ];
    });

    it('should update user mapping users with the provided programmer device if device is marked as user device', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ type: UserType.User }),
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const mockGetUserName = vi.fn().mockResolvedValue('P-2');
      (service as any).getUserName = mockGetUserName;

      const programmerDevice: ProgrammerDeviceUID = {
        userId: 'user1',
        name: 'Device 3',
      };
      await (service as any).updateUserMappingUsers(
        programmerDevice,
        allDevices
      );

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${
          programmerDevice.userId
        }`
      );
      expect(mockSet).toHaveBeenCalledWith(
        {
          name: 'P-2',
          type: UserType.Programmer,
          device: 'Device 3',
          lastUpdated: expect.any(Date),
        },
        { merge: true }
      );
    });

    it('should do nothing with the provided programmer device if device is already programmer device', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ type: UserType.Programmer }),
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const programmerDevice: ProgrammerDeviceUID = {
        userId: 'user1',
        name: 'Device 3',
      };
      await (service as any).updateUserMappingUsers(
        programmerDevice,
        allDevices
      );

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${
          programmerDevice.userId
        }`
      );
      expect(mockSet).not.toHaveBeenCalled();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should log and create new user mapping doc with the provided programmer device if user does not exist', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const mockGetUserName = vi.fn().mockResolvedValue('P-2');
      (service as any).getUserName = mockGetUserName;

      const programmerDevice: ProgrammerDeviceUID = {
        userId: 'user1',
        name: 'Device 3',
      };
      await (service as any).updateUserMappingUsers(
        programmerDevice,
        allDevices
      );

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${
          programmerDevice.userId
        }`
      );
      expect(mockSet).toHaveBeenCalledWith(
        {
          userId: programmerDevice.userId,
          name: 'P-2',
          type: UserType.Programmer,
          device: programmerDevice.name,
          createdAt: expect.any(Date),
        },
        { merge: true }
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        `User mapping document for user ${programmerDevice.userId} does not exist. Creating new document...`
      );
    });
  });

  describe('createUserMappingProgrammerDevices', () => {
    it('should log and create new programmer device doc with the provided programmer device if device does not exist', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const programmerDevice: ProgrammerDeviceUID = {
        userId: 'user1',
        name: 'Device 3',
      };
      await (service as any).createUserMappingProgrammerDevices(
        programmerDevice
      );

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)}/${
          programmerDevice.userId
        }`
      );
      expect(mockSet).toHaveBeenCalledWith(
        {
          userId: programmerDevice.userId,
          device: programmerDevice.name,
          createdAt: expect.any(Date),
        },
        { merge: true }
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        `Created programmer device mapping for userId: ${programmerDevice.userId}`
      );
    });

    it('should do nothing with the provided programmer device if device already exists', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const programmerDevice: ProgrammerDeviceUID = {
        userId: 'user1',
        name: 'Device 3',
      };
      await (service as any).createUserMappingProgrammerDevices(
        programmerDevice
      );

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)}/${
          programmerDevice.userId
        }`
      );
      expect(mockSet).not.toHaveBeenCalled();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('getProgrammerDeviceUIDs', () => {
    it('should return programmer devices', async () => {
      const mockCollectionData: ProgrammerDeviceUID[] = [
        { userId: 'user1', name: 'device 1' },
        { userId: 'user2', name: 'device 2' },
      ];
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        docs: mockCollectionData.map((d) => ({ data: () => d })),
      });
      const mockCollection = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };

      const result = await service.getProgrammerDeviceUIDs();

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)
      );
      expect(result).toEqual(mockCollectionData);
    });

    it('should log and return empty array if collection is empty', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        empty: true,
        docs: [],
      });
      const mockCollection = vi.fn().mockReturnValue({ get: mockGet });
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };

      const result = await service.getProgrammerDeviceUIDs();

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)
      );
      expect(result).toEqual([]);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'No programmer devices found in Firestore.'
      );
    });

    it('should log and throw an error if get fails', async () => {
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error('Failed to get programmer devices'));
      const mockCollection = vi.fn().mockReturnValue({ get: mockGet });
      const mockConsoleError = vi.spyOn(console, 'error');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };

      await expect(service.getProgrammerDeviceUIDs()).rejects.toThrow(
        'Failed to get programmer devices'
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error retrieving programmer devices from Firestore:',
        expect.any(Error)
      );
    });
  });

  describe('isProgrammerDevice', () => {
    let mockCollectionData: ProgrammerDeviceUID[];

    beforeEach(() => {
      mockCollectionData = [
        { userId: 'user1', name: 'device 1' },
        { userId: 'user2', name: 'device 2' },
      ];
    });

    it('should return true if programmer device mapping exists for the user', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        docs: mockCollectionData.map((d) => ({ data: () => d })),
      });
      const mockCollection = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };
      service.userId = 'user1';

      const result = await service.isProgrammerDevice();

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)
      );
      expect(result).toBe(true);
    });

    it('should return false if programmer device mapping does not exist for the user', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        docs: mockCollectionData.map((d) => ({ data: () => d })),
      });
      const mockCollection = vi.fn().mockReturnValue({ get: mockGet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };
      service.userId = 'user3';

      const result = await service.isProgrammerDevice();

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)
      );
      expect(result).toBe(false);
    });

    it('should log and return false if programmer device mapping does not exist', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        empty: true,
      });
      const mockCollection = vi.fn().mockReturnValue({ get: mockGet });
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };
      service.userId = 'user1';

      const result = await service.isProgrammerDevice();

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)
      );
      expect(result).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'No programmer devices found in Firestore.'
      );
    });

    it('should throw and log if get fails', async () => {
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error('Failed to get programmer devices'));
      const mockCollection = vi.fn().mockReturnValue({ get: mockGet });
      const mockConsoleError = vi.spyOn(console, 'error');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };
      service.userId = 'user1';

      await expect(service.isProgrammerDevice()).rejects.toThrow(
        'Failed to get programmer devices'
      );

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingProgrammerDevicesCollectionPath(collection)
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error checking if device is a programmer device from Firestore:',
        expect.any(Error)
      );
    });
  });

  describe('addUser', () => {
    let programmerDeviceUIDs: ProgrammerDeviceUID[],
      deviceInfo: DeviceInfo,
      isNative: boolean;

    beforeEach(() => {
      programmerDeviceUIDs = [
        { userId: 'user1', name: 'Device 1' },
        { userId: 'user2', name: 'Device 2' },
      ];
      deviceInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'Windows',
        language: 'en-US',
        appVersion: {
          major: 1,
          minor: 0,
          date: '2026-02-01',
        },
      };
      isNative = false;
    });

    it('should add user as type user with unknown device if user does not exist', async () => {
      const userId = 'userId_with_no_programmerDevice';
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');
      const mockGetUserName = vi.fn().mockResolvedValue('Test User');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };
      (service as any).getUserName = mockGetUserName;

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo, isNative);

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${userId}`
      );
      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledExactlyOnceWith(
        {
          name: 'Test User',
          type: UserType.User,
          device: 'unknown',
          deviceInfo,
          isNative,
          userId,
          createdAt: expect.any(Date),
        },
        { merge: true }
      );
      expect(mockGetUserName).toHaveBeenCalledExactlyOnceWith(
        userId,
        programmerDeviceUIDs
      );
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should add user with isNative = false if user does not exist and isNative is not provided', async () => {
      const userId = 'userId_with_no_programmerDevice';
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');
      const mockGetUserName = vi.fn().mockResolvedValue('Test User');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };
      (service as any).getUserName = mockGetUserName;

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo);

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${userId}`
      );
      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledExactlyOnceWith(
        {
          name: 'Test User',
          type: UserType.User,
          device: 'unknown',
          deviceInfo,
          isNative: false,
          userId,
          createdAt: expect.any(Date),
        },
        { merge: true }
      );
      expect(mockGetUserName).toHaveBeenCalledExactlyOnceWith(
        userId,
        programmerDeviceUIDs
      );
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should add user as type programmer with known device if user does not exist', async () => {
      const userId = 'user1';
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');
      const mockGetUserName = vi.fn().mockResolvedValue('Test User');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };
      (service as any).getUserName = mockGetUserName;

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo, isNative);

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${userId}`
      );
      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledExactlyOnceWith(
        {
          name: 'Test User',
          type: UserType.Programmer,
          device: 'Device 1',
          deviceInfo,
          isNative,
          userId,
          createdAt: expect.any(Date),
        },
        { merge: true }
      );
      expect(mockGetUserName).toHaveBeenCalledExactlyOnceWith(
        userId,
        programmerDeviceUIDs
      );
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should throw if userId is missing', async () => {
      const service = new FirebaseFirestoreService('testUserId');

      await expect(
        service.addUser('', programmerDeviceUIDs, deviceInfo, isNative)
      ).rejects.toThrow('userId must be provided');

      await expect(service.addUser()).rejects.toThrow(
        'userId must be provided'
      );
    });

    it('should update deviceInfo and log if user deviceInfo  does not exist', async () => {
      const userId = 'userId_with_no_programmerDevice';
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Test User',
          type: UserType.User,
          device: 'unknown',
          isNative,
          userId,
          createdAt: expect.any(Date),
        }),
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo);

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${userId}`
      );
      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledExactlyOnceWith(
        {
          deviceInfo,
          isNative,
          lastUpdated: expect.any(Date),
        },
        { merge: true }
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Updated user mapping document with device info for user:',
        userId
      );
    });

    it('should update deviceInfo and log if user deviceInfo is different', async () => {
      const userId = 'userId_with_no_programmerDevice';
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Test User',
          type: UserType.User,
          device: 'unknown',
          deviceInfo: {
            userAgent: 'Mozilla/5.0',
            platform: 'Windows',
            language: 'de-DE',
          },
          isNative,
          userId,
          createdAt: expect.any(Date),
        }),
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo);

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${userId}`
      );
      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledExactlyOnceWith(
        {
          deviceInfo,
          isNative,
          lastUpdated: expect.any(Date),
        },
        { merge: true }
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Updated user mapping document with device info for user:',
        userId
      );
    });

    it('should not update deviceInfo and log if user deviceInfo is the same', async () => {
      const userId = 'userId_with_no_programmerDevice';
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Test User',
          type: UserType.User,
          device: 'unknown',
          deviceInfo,
          isNative,
          userId,
          createdAt: expect.any(Date),
        }),
      });
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleLog = vi.spyOn(console, 'log');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo);

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUserMappingUsersCollectionPath(collection)}/${userId}`
      );
      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should log error if get fails', async () => {
      const userId = 'userId_with_no_programmerDevice';
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error('Failed to get user document'));
      const mockDocRef = { get: mockGet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleError = vi.spyOn(console, 'error');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error upserting user:',
        userId,
        expect.any(Error)
      );
    });

    it('should log error if set fails', async () => {
      const userId = 'userId_with_no_programmerDevice';
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          name: 'Test User',
          type: UserType.User,
          device: 'unknown',
          deviceInfo: {},
          isNative,
          userId,
          createdAt: expect.any(Date),
        }),
      });
      const mockSet = vi
        .fn()
        .mockRejectedValue(new Error('Failed to set user document'));
      const mockDocRef = { get: mockGet, set: mockSet };
      const mockDoc = vi.fn().mockReturnValue(mockDocRef);
      const mockConsoleError = vi.spyOn(console, 'error');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      await service.addUser(userId, programmerDeviceUIDs, deviceInfo);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error upserting user:',
        userId,
        expect.any(Error)
      );
    });
  });

  describe('getUserName', () => {
    let programmerDevices: ProgrammerDeviceUID[];
    beforeEach(() => {
      programmerDevices = [
        { userId: 'user1', name: 'Device 1' },
        { userId: 'user2', name: 'Device 2' },
      ];
    });

    it('should return user name for user device', async () => {
      const service = new FirebaseFirestoreService('testUserId');
      const mockCountUser = vi.fn().mockResolvedValue(1);
      (service as any).countUser = mockCountUser;

      const result = await (service as any).getUserName(
        'user3',
        programmerDevices
      );

      expect(mockCountUser).toHaveBeenCalledWith(UserType.User);
      expect(result).toBe('U-2');
    });

    it('should return user name for programmer device', async () => {
      const service = new FirebaseFirestoreService('testUserId');
      const mockCountUser = vi.fn().mockResolvedValue(1);
      (service as any).countUser = mockCountUser;

      const result = await (service as any).getUserName(
        'user1',
        programmerDevices
      );

      expect(mockCountUser).toHaveBeenCalledWith(UserType.Programmer);
      expect(result).toBe('P-2');
    });
  });

  describe('countUser', () => {
    it('should return the count of users of given type', async () => {
      const mockGet = vi.fn().mockResolvedValue({ size: 3 });
      const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
      const mockCollection = vi.fn().mockReturnValue({ where: mockWhere });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };

      const result = await (service as any).countUser(UserType.Programmer);

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingUsersCollectionPath(collection)
      );
      expect(mockWhere).toHaveBeenCalledWith('type', '==', UserType.Programmer);
      expect(result).toBe(3);
    });

    it('should return 0 if no users of given type exist', async () => {
      const mockGet = vi.fn().mockResolvedValue({ size: 0 });
      const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
      const mockCollection = vi.fn().mockReturnValue({ where: mockWhere });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };

      const result = await (service as any).countUser(UserType.User);

      expect(mockCollection).toHaveBeenCalledWith(
        FireStoreConstants.getUserMappingUsersCollectionPath(collection)
      );
      expect(mockWhere).toHaveBeenCalledWith('type', '==', UserType.User);
      expect(result).toBe(0);
    });

    it('should log error and throw wrapped error if Firestore get fails', async () => {
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error('Firestore error in GET'));
      const mockWhere = vi.fn().mockReturnValue({ get: mockGet });
      const mockCollection = vi.fn().mockReturnValue({ where: mockWhere });
      const mockConsoleError = vi.spyOn(console, 'error');

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { collection: mockCollection };

      await expect((service as any).countUser(UserType.User)).rejects.toThrow(
        'Error counting users for type: ' + UserType.User
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error getting user number for type:',
        UserType.User,
        expect.any(Error)
      );
    });
  });

  describe('addTranslatedChars', () => {
    const count = 5;
    const selectedLanguages = ['en', 'fr'];

    let mockUpdateUserCharCount: any;
    let mockUpdateTotalCharCount: any;
    let service: any;

    beforeEach(() => {
      mockUpdateUserCharCount = vi.fn().mockResolvedValue(undefined);
      mockUpdateTotalCharCount = vi.fn().mockResolvedValue(undefined);

      service = new FirebaseFirestoreService('testUserId');

      (service as any).updateUserCharCount = mockUpdateUserCharCount;
      (service as any).updateTotalCharCount = mockUpdateTotalCharCount;
    });

    it('should update user and total char counts', async () => {
      (service as any).userId = 'user1';
      await service.addTranslatedChars(count, selectedLanguages);

      expect(mockUpdateUserCharCount).toHaveBeenCalledWith(
        count,
        selectedLanguages
      );
      expect(mockUpdateTotalCharCount).toHaveBeenCalledWith(count);
    });

    it('should exit function if userId is not set', async () => {
      (service as any).userId = null;
      await service.addTranslatedChars(count, selectedLanguages);

      expect(mockUpdateUserCharCount).not.toHaveBeenCalled();
      expect(mockUpdateTotalCharCount).not.toHaveBeenCalled();
    });

    it('should log error if updateUserCharCount fails', async () => {
      (service as any).userId = 'user1';
      const error = new Error('Failed to update user char count');
      mockUpdateUserCharCount.mockRejectedValue(error);
      const mockConsoleError = vi.spyOn(console, 'error');

      await service.addTranslatedChars(count, selectedLanguages);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error writing user char count document:',
        error
      );
      expect(mockUpdateTotalCharCount).toHaveBeenCalledWith(count);
    });

    it('should log error if updateTotalCharCount fails', async () => {
      (service as any).userId = 'user1';
      const error = new Error('Failed to update total char count');
      mockUpdateTotalCharCount.mockRejectedValue(error);
      const mockConsoleError = vi.spyOn(console, 'error');

      await service.addTranslatedChars(count, selectedLanguages);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error writing total char count document:',
        error
      );
      expect(mockUpdateUserCharCount).toHaveBeenCalledWith(
        count,
        selectedLanguages
      );
    });
  });

  describe('updateUserCharCount', () => {
    it('should update user char count and target languages', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };
      service.userId = 'user1';

      const count = 25;
      const selectedLanguages = ['en', 'fr'];

      await (service as any).updateUserCharCount(count, selectedLanguages);

      expect(mockDoc).toHaveBeenCalledWith(
        `${FireStoreConstants.getUsersCollectionPath(collection)}/${service.userId}`
      );
      expect(mockIncrement).toHaveBeenCalledWith(count);
      expect(mockSet).toHaveBeenCalledWith(
        {
          charCount: { __incrementBy: count },
          targetLanguages: selectedLanguages,
          lastUpdated: expect.any(Date),
        },
        { merge: true }
      );
    });
  });

  describe('updateTotalCharCount', () => {
    it('should update total char count', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });

      const service = new FirebaseFirestoreService('testUserId');
      service.db = { doc: mockDoc };

      const count = 25;

      await (service as any).updateTotalCharCount(count);

      expect(mockDoc).toHaveBeenCalledWith(
        FireStoreConstants.getMetaTotalCharsDocumentPath(collection)
      );
      expect(mockIncrement).toHaveBeenCalledWith(count);
      expect(mockSet).toHaveBeenCalledWith(
        {
          charCount: { __incrementBy: count },
          lastUpdated: expect.any(Date),
        },
        { merge: true }
      );
    });
  });
});
