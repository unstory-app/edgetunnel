import { Hono } from "hono";
import { validateApiKey } from "../lib/auth";

export const authRoute = new Hono<{ Bindings: Env }>();

authRoute.post("/", async (c) => {
    const body = (await c.req.json().catch(() => null)) as { apiKey?: string } | null;
    if (!body?.apiKey) {
        return c.json({ error: "apiKey is required" }, 400);
    }

    const auth = await validateApiKey(body.apiKey, c.env);
    if (!auth) {
        return c.json({ valid: false }, 401);
    }

    return c.json({ valid: true, ...auth });
});
