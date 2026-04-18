import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
} from 'vitest';

beforeAll(() => console.log('1 - beforeAll'));
afterAll(() => console.log('8 - afterAll'));
beforeEach(() => console.log('2 - beforeEach'));
afterEach(() => console.log('7 - afterEach'));

describe('suite', () => {
  beforeEach(() => console.log('3 - inner beforeEach'));
  afterEach(() => console.log('6 - inner afterEach'));

  describe('show execution order', () => {
    const testNumber = 1;

    beforeEach(() => console.log('4 - nested beforeEach'));
    afterEach(() => console.log('5 - nested afterEach'));

    // note: it is an alias for `test`
    test('show execution order', () => {
      console.log(`test ${testNumber}`);
    });
  });

  describe('show execution order', () => {
    const testNumber = 2;

    beforeEach(() => console.log('4 - nested beforeEach'));
    afterEach(() => console.log('5 - nested afterEach'));

    // note: it is an alias for `test`
    it('should show execution order', () => {
      console.log(`test ${testNumber}`);
    });
  });
});
