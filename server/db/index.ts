import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Neon 클라이언트 생성
const sql = neon(process.env.NUXT_NEON_ENDPOINT!);

// Drizzle ORM 클라이언트 생성
export const db = drizzle(sql, { schema });

export default db;