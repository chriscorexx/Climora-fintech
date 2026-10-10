import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Ensures every UI test starts with an unmounted component tree, even if a
// test forgets to call cleanup() itself.
afterEach(() => {
  cleanup();
});
