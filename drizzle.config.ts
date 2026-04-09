import type { Config } from "drizzle-kit";

export default {
  schema: "./packages/config/drizzle/schema.ts",
  out: "./packages/config/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
