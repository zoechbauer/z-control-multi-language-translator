import { describe, expect, it, vi } from 'vitest';

describe('Learn Vitest', () => {
  it('should run this test', () => {
    expect(true).toBe(true);
  });

  describe('async tests', () => {
    it('should test async code', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });
  });

  describe('comparisons of number & string & truthiness', () => {
    it('should test number comparisons', () => {
      const num = 10;
      expect(num).toBeGreaterThan(5);
      expect(num).toBeLessThan(20);
      expect(num).toBeCloseTo(10.01, 1);
    });

    it('should test string matching', () => {
      const str = 'Hello, Vitest!';
      expect(str).toMatch(/Vitest/);
      expect(str).toHaveLength(14);
    });

    it('should test truthiness', () => {
      const value = 'non-empty string';
      expect(value).toBeTruthy();
      expect('').toBeFalsy();
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();
    });
  });

  describe('array & object tests', () => {
    it('should test object equality', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };
      expect(obj1).toEqual(obj2);
    });

    it('should test array contents', () => {
      const arr = [1, 2, 3];
      expect(arr).toContain(2);
      expect(arr).toHaveLength(3);
    });

    it('should test object properties', () => {
      const obj = { name: 'Vitest', version: '1.0' };
      expect(obj).toHaveProperty('name');
      expect(obj).toHaveProperty('version', '1.0');
    });

    it('should test array of objects', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(arr).toEqual(expect.arrayContaining([{ id: 3 }, { id: 2 }]));
      expect(arr).toContainEqual({ id: 2 });
    });
  });

  describe('error handling', () => {
    it('should test throwing errors', () => {
      const throwError = () => {
        throw new Error('This is an error');
      };
      expect(throwError).toThrow('This is an error');
      expect(throwError).toThrowError('This is an error');
    });

    it('should test async error throwing', async () => {
      const asyncThrowError = async () => {
        throw new Error('Async error');
      };
      await expect(asyncThrowError()).rejects.toThrow('Async error');
    });
  });

  it('should test snapshot', () => {
    const obj = { name: 'Vitest', version: '1.0' };
    expect(obj).toMatchSnapshot();
  });

  describe('mock functions', () => {
    it('should test mock functions', () => {
      const mockFn = vi.fn();
      mockFn();
      expect(mockFn).toHaveBeenCalled();
    });

    it('should test mock functions with arguments', () => {
      const mockFn = vi.fn();
      mockFn('hello', 42);
      expect(mockFn).toHaveBeenCalledWith('hello', 42);
    });

    it('should test mock functions with return value', () => {
      const mockFn = vi.fn().mockReturnValue('mocked value');
      expect(mockFn()).toBe('mocked value');
    });

    it('should test mock functions with implementation', () => {
      const mockFn = vi.fn().mockImplementation((x) => x * 2);
      expect(mockFn(5)).toBe(10);
    });
  });
});
