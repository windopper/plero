import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['test/**/*.test.ts'],
    coverage: {
      include: ['server/**/*.ts'],
    },
    setupFiles: ['./test/setup.ts'],
    api: {
      port: 3000,
      host: 'localhost',
    },
  },
})
