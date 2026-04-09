import { z } from "zod";

export const PlanTierSchema = z.enum(["free", "pro", "enterprise"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const ApiKeyPayloadSchema = z.object({
    apiKey: z.string().min(16),
    userId: z.string().uuid(),
    plan: PlanTierSchema,
});
export type ApiKeyPayload = z.infer<typeof ApiKeyPayloadSchema>;

export const ProxyNodeSchema = z.object({
    id: z.string(),
    region: z.string(),
    endpoint: z.string().url(),
    weight: z.number().int().positive().default(1),
    dedicatedOnly: z.boolean().default(false),
});
export type ProxyNode = z.infer<typeof ProxyNodeSchema>;

export const UsageEventSchema = z.object({
    userId: z.string().uuid(),
    requestId: z.string().min(8),
    method: z.string(),
    targetHost: z.string(),
    bytesIn: z.number().int().nonnegative(),
    bytesOut: z.number().int().nonnegative(),
    latencyMs: z.number().nonnegative(),
    statusCode: z.number().int(),
    at: z.string().datetime(),
});
export type UsageEvent = z.infer<typeof UsageEventSchema>;

export const SignedProxyRequestSchema = z.object({
    method: z.string().min(3),
    url: z.string().url(),
    headers: z.record(z.string()),
    bodyBase64: z.string().optional(),
    timestamp: z.number().int(),
    nonce: z.string().min(8),
    userId: z.string().uuid(),
    plan: PlanTierSchema,
    regionHint: z.string().optional(),
});
export type SignedProxyRequest = z.infer<typeof SignedProxyRequestSchema>;
