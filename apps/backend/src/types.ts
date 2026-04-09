import { z } from "zod";

export const RoutePayloadSchema = z.object({
  method: z.string().min(3),
  url: z.string().url(),
  headers: z.record(z.string()).default({}),
  bodyBase64: z.string().optional(),
  timestamp: z.number().int(),
  nonce: z.string(),
  userId: z.string().uuid(),
  plan: z.enum(["free", "pro", "enterprise"]),
  regionHint: z.string().optional(),
  node: z.object({
    id: z.string(),
    region: z.string(),
    endpoint: z.string().url(),
    dedicatedOnly: z.boolean(),
  }),
});

export type RoutePayload = z.infer<typeof RoutePayloadSchema>;
