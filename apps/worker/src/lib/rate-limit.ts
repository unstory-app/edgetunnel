import type { Context } from "hono";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 300;

export async function assertRateLimit(c: Context, userId: string): Promise<void> {
    const nowWindow = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
    const key = `rl:${userId}:${nowWindow}`;

    const current = Number(await c.env.RATE_LIMIT_KV.get(key));
    if (current >= MAX_REQUESTS_PER_WINDOW) {
        throw new Error("Rate limit exceeded");
    }

    await c.env.RATE_LIMIT_KV.put(key, String(current + 1), {
        expirationTtl: WINDOW_SECONDS + 5,
    });
}
