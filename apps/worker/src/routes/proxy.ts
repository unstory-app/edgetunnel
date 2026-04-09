import { Hono } from "hono";
import { assertRateLimit } from "../lib/rate-limit";
import { validateApiKey } from "../lib/auth";
import { pickProxyNode } from "../lib/routing";
import { signPayload, verifyPayload } from "../lib/signature";
import { assertAllowedTarget } from "../lib/domain-guard";

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

    try {
        assertAllowedTarget(target);
    } catch {
        return c.json({ error: "blocked target" }, 403);
    }

    const ts = c.req.header("x-edgetunnel-ts") ?? "";
    const nonce = c.req.header("x-edgetunnel-nonce") ?? "";
    const inboundSignature = c.req.header("x-edgetunnel-signature") ?? "";
    const signedPayload = [c.req.method, target, ts, nonce].join("\n");
    if (!(await verifyPayload(signedPayload, inboundSignature, c.env.REQUEST_SIGNING_SECRET))) {
        return c.json({ error: "invalid signature" }, 401);
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
