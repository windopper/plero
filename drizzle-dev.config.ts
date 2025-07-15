import type { Config } from 'drizzle-kit';

export default {
  schema: './server/db/schema.ts',
  out: './server/db/migrations/dev',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NUXT_DEV_NEON_ENDPOINT!,
  },
  migrations: {
    schema: 'drizzle',
  },
  verbose: true,
  strict: true,
} satisfies Config; 