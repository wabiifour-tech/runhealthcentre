// Prisma configuration for TeleHealth Nigeria
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "file:/home/z/my-project/db/telehealth.db",
  },
});
