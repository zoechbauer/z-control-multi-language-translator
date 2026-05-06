/**
 * Global test setup: Mock console methods to reduce noise in test output.
 * 
 * This setup file silences console.log, console.warn, and console.error to prevent
 * cluttering test results with unintended logs from the code under test.
 * 
 * For temporary debugging during test development:
 * - Use console.info() instead - it is NOT mocked and will always appear in stdout
 * - It's ideal for quickly inspecting mock calls, variable values, or flow
 * - Remove console.info calls before committing (don't pollute CI logs)
 * 
 * Example:
 *   const result = await service.doSomething();
 *   console.info('Result:', result);  // This will show in test output
 *   
 * To spy on mocked methods in a specific test:
 *   const spy = vi.spyOn(console, 'log');
 *   // ... run test code ...
 *   expect(spy).toHaveBeenCalledWith('expected message');
 *   spy.mockRestore();
 */

import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});