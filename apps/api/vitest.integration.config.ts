import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.spec.ts'],
    setupFiles: ['./test/setup-integration.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5434/networking_test',
      JWT_SECRET: 'test-secret-jwt-key-min-32-characters-long',
      ADMIN_KEY: 'test-admin-key-16chars',
      INVITE_TTL_DAYS: '7',
    },
    poolOptions: {
      threads: {
        singleThread: true, // Evitar race conditions em testes de DB
      },
    },
  },
})
