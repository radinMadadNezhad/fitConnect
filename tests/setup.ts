/**
 * Loaded by vitest before any test file.
 *
 * Several modules read env vars at import time and throw when they are absent
 * (src/lib/stripe.ts) or warn (src/lib/auth.ts). These values are inert test
 * placeholders — no network call is made with them.
 */

process.env.STRIPE_SECRET_KEY ??= 'sk_test_placeholder_for_unit_tests';
process.env.STRIPE_PLATFORM_FEE_PERCENT ??= '10';
process.env.JWT_SECRET ??= 'unit-test-signing-key-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN ??= '7d';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';

// Keep tests from attempting real sends; the console transport is asserted on.
process.env.EMAIL_PROVIDER ??= 'console';
