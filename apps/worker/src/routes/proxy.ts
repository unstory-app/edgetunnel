import { Hono } from "hono";
import { assertRateLimit } from "../lib/rate-limit";
import { validateApiKey } from "../lib/auth";
import { pickProxyNode } from "../lib/routing";
import { signPayload, verifyPayload } from "../lib/signature";

export const proxyRoute = new Hono<{ Bindings: Env }>();

proxyRoute.all("/", async (c) => {
    const apiKey = c.req.header("x-api-key") ?? "";
    const auth = await validateApiKey(apiKey, c.env);
    if (!auth) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    await assertRateLimit(c, auth.userId);

    const target = c.req.header("x-edgetunnel-target");
    if (!target) {
        return c.json({ error: "missing target" }, 400);
    }

    const bodyRaw = c.req.method === "GET" || c.req.method === "HEAD" ? undefined : await c.req.arrayBuffer();
    const requestPayload = {
        method: c.req.method,
        url: target,
        headers: Object.fromEntries(c.req.raw.headers.entries()),
        bodyBase64: bodyRaw ? btoa(String.fromCharCode(...new Uint8Array(bodyRaw))) : undefined,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: crypto.randomUUID(),
        userId: auth.userId,
        plan: auth.plan,
        regionHint: c.req.header("cf-ipcountry")?.toLowerCase(),
    };

    const rawPayload = JSON.stringify(requestPayload);
    const inboundSignature = c.req.header("x-edgetunnel-signature");
    if (!inboundSignature || !(await verifyPayload(rawPayload, inboundSignature, c.env.REQUEST_SIGNING_SECRET))) {
        return c.json({ error: "invalid signature" }, 401);
    }

    const node = pickProxyNode(c.env, auth.plan, requestPayload.regionHint);
    const controllerPayload = JSON.stringify({ ...requestPayload, node });
    const controllerSignature = await signPayload(controllerPayload, c.env.CONTROLLER_SHARED_SECRET);

    const controllerRes = await fetch(`${c.env.PROXY_CONTROLLER_URL}/route`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-edgetunnel-signature": controllerSignature,
            authorization: `Bearer ${c.env.CONTROLLER_INTERNAL_TOKEN}`,
        },
        body: controllerPayload,
    });

    return new Response(controllerRes.body, {
        status: controllerRes.status,
        headers: controllerRes.headers,
    });
});
