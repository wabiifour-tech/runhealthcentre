// Prisma configuration for Supabase PostgreSQL
// Install: npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

// During build, use a dummy URL if DATABASE_URL is not set
// This allows prisma generate to work without actual DB connection
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy?schema=public';
const directUrl = process.env.DIRECT_DATABASE_URL || databaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
