import { Hono } from "hono";

export const usageRoute = new Hono<{ Bindings: Env }>();

usageRoute.post("/", async (c) => {
    const apiKey = c.req.header("x-api-key");
    if (!apiKey) {
        return c.json({ error: "missing api key" }, 401);
    }

    const payload = (await c.req.json().catch(() => null)) as {
        userId?: string;
        requestId?: string;
        bytesIn?: number;
        bytesOut?: number;
        statusCode?: number;
        targetHost?: string;
        latencyMs?: number;
    } | null;

    if (!payload?.userId || !payload.requestId) {
        return c.json({ error: "invalid payload" }, 400);
    }

    await c.env.USAGE_DB.prepare(
        "INSERT INTO usage_logs (id, user_id, request_id, target_host, bytes_in, bytes_out, latency_ms, status_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))",
    )
        .bind(
            crypto.randomUUID(),
            payload.userId,
            payload.requestId,
            payload.targetHost ?? "unknown",
            payload.bytesIn ?? 0,
            payload.bytesOut ?? 0,
            payload.latencyMs ?? 0,
            payload.statusCode ?? 0,
        )
        .run();

    return c.json({ ok: true });
});
