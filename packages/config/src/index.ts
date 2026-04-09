import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "../drizzle/schema";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export type EdgeTunnelDb = ReturnType<typeof createDb>;

export function createDb(env = process.env) {
  const parsed = EnvSchema.parse(env);
  const client = postgres(parsed.DATABASE_URL, {
    max: 20,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

export { schema };
