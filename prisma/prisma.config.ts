import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // This is where URLs live now
  datasource: {
    url: env('POSTGRES_URL'),
    directUrl: env('POSTGRES_URL_NON_POOLING'),
  },
});
