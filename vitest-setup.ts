import { afterAll } from 'vitest';
import '@testing-library/jest-dom/vitest';

/**
 * Outlives bits-ui's own cleanup timer.
 *
 * Closing a dialog schedules the body-scroll-lock reset 24ms later, and the file it belongs to
 * can finish first — the timer then fires against a `document` happy-dom has already taken
 * away, and vitest reports an unhandled `ReferenceError` for a suite where every test passed.
 * It is a race, so it failed only sometimes and only in whichever file was last to close one.
 *
 * Per file rather than per test: `setupFiles` runs once for each, which makes this about thirty
 * waits for the whole suite instead of two hundred and fifty.
 */
afterAll(async () => {
	await new Promise((resolve) => setTimeout(resolve, 50));
});
