import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false, // Run test files serially to prevent DB write contention and bcrypt CPU thrashing
  },
});
