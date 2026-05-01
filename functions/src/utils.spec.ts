import { describe, expect, it, vi } from 'vitest';

import { UserType } from './shared/app.constants.js';
import {
  getErrorMsg,
  getDeviceName,
  getUserType,
  isValidDevice,
} from './utils.js';

const programmerDeviceUIDs = [{ userId: 'user1', name: 'Device 1' }];

describe('getErrorMsg', () => {
  it('should return message from error object', () => {
    const error = new Error('Test error message');
    expect(getErrorMsg(error)).toBe('Test error message');
  });

  it('should return message from param if no error object is provided', () => {
    const error = new Error('');
    const paramError = 'Test error message';
    expect(getErrorMsg(error, paramError)).toBe(paramError);
  });

  it('should return the error string if a string is passed', () => {
    const error = 'Simple error string';
    expect(getErrorMsg(error)).toBe(error);
  });

  it('should return default message if error object has no message and no param is provided', () => {
    const error = {};
    expect(getErrorMsg(error)).toBe('An unknown error occurred.');
  });
});

describe('isValidDevice', () => {
  const invalidProgrammerDeviceUIDs = [
    { userId: '', name: 'Device 1' },
    { userId: 'userId', name: '' },
    { userId: '', name: '' },
    {} as any,
  ];

  it('should return true for valid devices', () => {
    expect(programmerDeviceUIDs.every(isValidDevice)).toBe(true);
  });

  it('should return false for devices missing userId or name', () => {
    invalidProgrammerDeviceUIDs.forEach((device) => {
      expect(isValidDevice(device)).toBe(false);
    });
  });

  it('should log a warning for invalid devices', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');
    invalidProgrammerDeviceUIDs.forEach((device) => {
      isValidDevice(device);
    });
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});

describe('getDeviceName', () => {
  it('should return the device name if userId is in programmerDeviceUIDs', () => {
    const deviceName = getDeviceName('user1', programmerDeviceUIDs);
    expect(deviceName).toBe('Device 1');
  });

  it('should return "unknown" if userId is not in programmerDeviceUIDs', () => {
    const deviceName = getDeviceName('user2', programmerDeviceUIDs);
    expect(deviceName).toBe('unknown');
  });
});

describe('getUserType', () => {
  it('should return UserType.Programmer if userId is in programmerDeviceUIDs', () => {
    const userType = getUserType('user1', programmerDeviceUIDs);
    expect(userType).toBe(UserType.Programmer);
  });

  it('should return UserType.User if userId is not in programmerDeviceUIDs', () => {
    const userType = getUserType('user2', programmerDeviceUIDs);
    expect(userType).toBe(UserType.User);
  });
});
