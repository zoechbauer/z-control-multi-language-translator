# Testing Firestore functions with the z-control-staging environment

New changes of Firestore security rules and Cloud Functions should be thoroughly tested

- with Firebase Emulator Suite and
- in this staging environment (z-control-staging) before being promoted to production.

## Quick overview

1. Deploy functions to staging
2. Configure frontend(s) to use staging
3. Test frontend against staging functions and Firestore rules
4. Monitor logs and metrics (see documentation in `z-control Backend Functions` project)
5. Promote to production when tests pass

## Deploy functions to staging

see documentation in `z-control Backend Functions` project.

## Configure frontend(s) for staging

To test all Firebase functions in the staging environment, you should configure each frontend to point to the staging environment:

- In each frontend repository, update environment settings to point to staging APIs and Firestore.
  - Example: set USE_STAGING_FUNCTIONS=true in `.env.local` and regenerate environment files:
    - Edit `.env.local`: **USE_STAGING_FUNCTIONS=true**
    - npm run generate-env
    - Restart dev server: npm run dev

## Test frontend against staging functions and Firestore rules

- Authentication and Authorization
  - Attempt reads/writes with an unauthenticated user (should fail where rules require auth).
  - Attempt operations as an authenticated user.

- Function behavior
  - Trigger each HTTP function and verify response codes and payloads.

- Edge cases
  - Malformed inputs, rate limits, large payloads, and timeout behavior.

## Success criteria (minimum)

- All tests of all frontend applications which use the staging environment succeed.
- No uncaught errors in function logs related to the change under test.
- Firestore rules reject all disallowed operations in manual tests.
- Performance is within acceptable limits for the change (no unexpected cold-start spikes or timeouts).

## Deploy to production

When tests succeed, deploy to production:

### Deploy functions to production

see documentation in `z-control Backend Functions` project.

### Frontend configuration for production

- In each frontend repository, update environment settings to point to production APIs and Firestore.
  - Example: set USE_STAGING_FUNCTIONS=false in `.env.local` and regenerate environment files:
    - Edit `.env.local`: **USE_STAGING_FUNCTIONS=false**
    - npm run generate-env
    - Restart dev server: npm run dev
