# Ionic Unit Testing Starter Guide + 10-Step Roadmap

This guide summarizes the most important testing decisions and commands for this project, and gives you a focused learning path.

## 1) Which stack should I learn first?

Short answer: start with **Jasmine + Karma** for this app.

Reason:
1. Your current project is already configured for Jasmine/Karma.
2. You can practice immediately without migration work.
3. You will learn core testing skills that also transfer to Jest later.

When to consider Jest later:
1. You want faster test runs on larger suites.
2. You want Jest-specific features like snapshots.
3. You are ready for migration effort and maintenance.

## 2) TypeScript test pattern: as unknown as Event

const event = {
  preventDefault: jasmine.createSpy('preventDefault'),
} as unknown as Event;

What it means:

as unknown: erase specific type info first.
as Event: force TypeScript to treat it as Event.
Why used in tests:

Your mock only has preventDefault.
A real Event has many more properties.
This pattern lets you pass a minimal mock where only one method is needed.
Tradeoff:

Convenient for tests.
Less strict type safety


## 3) Focused 10-step learning roadmap (Ionic + Angular)
1. Learn the test structure basics
Understand describe, it, beforeEach, afterEach, and Arrange/Act/Assert.

2. Run tests in both modes
  Practice npm test (watch) and npm test -- --watch=false (single run).

3. Start with one spec file
  Use --include to speed up feedback while learning.

4. Learn spies well
  Practice jasmine.createSpy, createSpyObj, spyOn, and spyOnProperty.

5. Mock dependencies with TestBed
  Provide mocked services/controllers in TestBed.configureTestingModule.

6. Practice service tests first
  Services are easier than UI components and build confidence quickly.

7. Add async testing patterns
  Learn async/await, plus fakeAsync and tick for timer-based behavior.

8. Test DOM interactions safely
  Mock document.getElementById, scrollIntoView, and browser globals only when needed.

9. Use coverage intentionally
  Run coverage and improve meaningful gaps, not just percentages.

10. Stabilize quality habits
  Keep tests small, deterministic, and independent. Add tests when fixing bugs so regressions are caught early.

## 4) Practical weekly plan (optional)
Week 1: Steps 1-3 (run tests confidently, one file at a time)

Week 2: Steps 4-6 (spies + TestBed + service testing)

Week 3: Steps 7-8 (async + DOM/browser mocks)

Week 4: Steps 9-10 (coverage + quality habits)

## 5) Final recommendation
For this repository:

Master Jasmine/Karma first.
Build confidence with real project tests.
Evaluate Jest later only if you need its specific benefits.
GPT-5.3-Codex • 0.9x
