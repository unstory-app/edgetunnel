import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { bigint, boolean, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const planTier = pgEnum("plan_tier", ["free", "pro", "enterprise"]);

export const plans = pgTable("plans", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 64 }).notNull().unique(),
    tier: planTier("tier").notNull(),
    monthlyBandwidth: bigint("monthly_bandwidth", { mode: "number" }).notNull(),
    dedicatedNode: boolean("dedicated_node").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    stackAuthId: varchar("stackauth_id", { length: 128 }).notNull().unique(),
    planId: uuid("plan_id").notNull().references(() => plans.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageLogs = pgTable("usage_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id),
    requestId: varchar("request_id", { length: 64 }).notNull().unique(),
    method: varchar("method", { length: 16 }).notNull(),
    targetHost: varchar("target_host", { length: 255 }).notNull(),
    bytesIn: bigint("bytes_in", { mode: "number" }).notNull().default(0),
    bytesOut: bigint("bytes_out", { mode: "number" }).notNull().default(0),
    latencyMs: integer("latency_ms").notNull(),
    statusCode: integer("status_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type EdgeTunnelDb = ReturnType<typeof createDb>;

export function createDb(url?: string) {
  const dbUrl = url || process.env.DATABASE_URL || "postgresql://neondb_owner:npg_a9MdqiY0HcOG@ep-bitter-sea-ansolhhi-pooler.c-6.us-east-1.aws.neon.tech/neondb";
  const client = postgres(dbUrl, {
    max: 20,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, {
    schema: {
      plans,
      users,
      apiKeys,
      usageLogs,
      planTier,
    },
  });
}