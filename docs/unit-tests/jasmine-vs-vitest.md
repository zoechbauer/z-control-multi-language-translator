# Jasmine to Vitest Cheat Sheet (Angular/Ionic)

This guide helps you learn from Angular testing docs that use Vitest while your current project still runs Jasmine + Karma.

## Can I use my existing tests?

Short answer: partly.

- You can reuse most test ideas and structure (`describe`, `it`, Arrange/Act/Assert).
- You usually cannot copy/paste every test line without changes.
- Your current Jasmine/Karma tests keep working as-is unless you migrate.

## What stays the same

- Test organization: suites, test cases, setup/teardown.
- Angular testing APIs: TestBed patterns and dependency injection in tests.
- Assertions and behavior intent.

## What usually changes

- Spy/mocking API (`jasmine.*` -> `vi.*`)
- Some matcher style differences
- Global setup and runner configuration

## Quick translation table

| Jasmine/Karma style                            | Vitest style                                |
| ---------------------------------------------- | ------------------------------------------- |
| `jasmine.createSpy('fn')`                      | `vi.fn()`                                   |
| `jasmine.createSpyObj('Router', ['navigate'])` | `{ navigate: vi.fn() }` (or helper factory) |
| `spyOn(obj, 'method')`                         | `vi.spyOn(obj, 'method')`                   |
| `spyOnProperty(obj, 'value', 'get')`           | `vi.spyOn(obj, 'value', 'get')`             |
| `expect(value).toBeTrue()`                     | `expect(value).toBe(true)`                  |
| `expect(value).toBeFalse()`                    | `expect(value).toBe(false)`                 |
| `expect(spy).toHaveBeenCalled()`               | same                                        |
| `expect(spy).toHaveBeenCalledWith(...)`        | same                                        |
| `beforeEach/afterEach`                         | same                                        |
| `describe/it`                                  | same                                        |

## Example 1: function spy

### Jasmine

```ts
const present = jasmine.createSpy("present").and.resolveTo(undefined);
```

### Vitest

```ts
const present = vi.fn().mockResolvedValue(undefined);
```

## Example 2: object with method spy

### Jasmine

```ts
const routerSpy = jasmine.createSpyObj("Router", ["navigate"]);
routerSpy.navigate(["/tabs/tab-translation"]);
expect(routerSpy.navigate).toHaveBeenCalledWith(["/tabs/tab-translation"]);
```

### Vitest

```ts
const routerSpy = { navigate: vi.fn() };
routerSpy.navigate(["/tabs/tab-translation"]);
expect(routerSpy.navigate).toHaveBeenCalledWith(["/tabs/tab-translation"]);
```

## Example 3: property getter spy

### Jasmine

```ts
spyOnProperty(globalThis, "innerWidth", "get").and.returnValue(700);
```

### Vitest

```ts
vi.spyOn(globalThis, "innerWidth", "get").mockReturnValue(700);
```

## Example 4: boolean matcher conversion

### Jasmine

```ts
expect(service.isSmallScreen).toBeTrue();
expect(service.isNative).toBeFalse();
```

### Vitest

```ts
expect(service.isSmallScreen).toBe(true);
expect(service.isNative).toBe(false);
```

## About `as unknown as Event`

Pattern:

```ts
const event = {
  preventDefault: jasmine.createSpy("preventDefault"),
} as unknown as Event;
```

Meaning:

1. Cast to `unknown` first.
2. Then cast to `Event`.

Why it appears in tests:

- Your mock has only the pieces you need (`preventDefault`).
- A full `Event` has many required members.
- This bypasses strict structural type checks.

Vitest equivalent:

```ts
const event = {
  preventDefault: vi.fn(),
} as unknown as Event;
```

## Recommended learning strategy for your project

1. Keep writing tests in Jasmine/Karma now.
2. Learn concepts from Vitest-based tutorials.
3. Translate syntax mentally with this cheat sheet.
4. Consider migration only after you are comfortable with unit-testing fundamentals.

## Migration readiness checklist

- [ ] You can write stable service tests with mocks and spies.
- [ ] You are comfortable with async tests (`async/await`, timer-based tests).
- [ ] Your team agrees on migration effort.
- [ ] You need Vitest-specific benefits (speed/ecosystem/workflow).
- [ ] CI command and coverage workflow are planned for the new runner.

If most boxes are not checked yet, stay with Jasmine/Karma and keep learning there first.
