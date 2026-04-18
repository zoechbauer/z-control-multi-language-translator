# Unit Test Types: Frontend and Backend

## Goal

This document defines the main unit test types used in this project and when to use each type.

## Frontend tests (Angular)

Frontend tests run with Jasmine and Karma.

### 1) Class logic tests

Purpose:

- Validate component and service behavior without relying on DOM rendering.
- Verify state changes, method calls, business rules, and branch logic.

Typical scope:

- Method return values
- Guard clauses
- Event handler logic
- Service interaction through spies/mocks
- Error handling branches

Good practices:

- Keep tests focused on one behavior.
- Mock dependencies with jasmine.createSpyObj.
- Assert side effects on component state and service calls.
- Avoid DOM queries unless rendering is part of the requirement.

### 2) Template rendering tests

Purpose:

- Validate rendered output and UI behavior in templates.
- Verify that bindings, conditionals, and user interactions are wired correctly.

Typical scope:

- Conditional rendering with @if or ngIf
- Branch rendering with @switch
- Button enabled or disabled state
- Event wiring from template to component methods
- Visibility and transitions between UI states

Good practices:

- Set explicit component state before fixture.detectChanges.
- Query DOM with clear selectors.
- Prefer shallow rendering with mocked child components when deep dependencies are not under test.
- Keep one test for one rendering expectation.

## Backend tests (Firebase Functions)

Backend tests should run with Vitest.

Purpose:

- Validate callable function input checks, auth checks, branching, and error mapping.
- Validate backend utility and service logic with deterministic mocks.

Typical scope:

- Request validation
- Authentication requirements
- Delegation to service layer
- Conversion of internal errors to HttpsError
- Utility method behavior (including edge cases)

Good practices:

- Mock external systems (Firestore, fetch, secrets, admin SDK).
- Keep most tests as pure unit tests.
- Add only a small number of integration tests (for example emulator smoke tests).
- Prefer deterministic fixtures and avoid network calls.

## Summary

Use class logic tests for behavior, template rendering tests for UI output, and Vitest backend tests for callable and service correctness.
