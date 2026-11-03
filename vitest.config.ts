import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    test: {
        environment: 'node',
        // Sets the env vars that src/lib/stripe.ts and src/lib/auth.ts require
        // at module load, before any test file imports them.
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
