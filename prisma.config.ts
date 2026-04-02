import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL!, // Direct (non-pooled) URL for Prisma CLI (migrate, generate, etc.)
  },
});
