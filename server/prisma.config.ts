import path from 'node:path';
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    // Use DIRECT_URL for migrations/schema push (bypasses PgBouncer)
    url: process.env.DIRECT_URL!,
  },
});
