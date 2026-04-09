import Fastify from "fastify";
import { request } from "undici";
import { logger } from "@edgetunnel/utils";
import { assertAllowedTarget } from "./guard";
import { httpsRequestViaProxy } from "./https-via-proxy";
import { getHttpsProxyAgent, pickNode } from "./routing";
import { verifyPayload } from "./signature";
import { RoutePayloadSchema } from "./types";

const app = Fastify({ logger: false });

app.get("/health", async () => ({ ok: true, service: "backend" }));

app.post("/route", async (req, reply) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CONTROLLER_INTERNAL_TOKEN}`) {
    return reply.status(401).send({ error: "unauthorized" });
  }

  const raw = JSON.stringify(req.body ?? {});
  const signature = req.headers["x-edgetunnel-signature"];
  if (typeof signature !== "string" || !verifyPayload(raw, signature, process.env.CONTROLLER_SHARED_SECRET ?? "")) {
    return reply.status(401).send({ error: "invalid_signature" });
  }

  const parsed = RoutePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "invalid_payload" });
  }

  const payload = parsed.data;
  const target = new URL(payload.url);
  assertAllowedTarget(target);

  const nodePool = JSON.parse(process.env.PROXY_NODES_JSON ?? "[]") as Array<{
    id: string;
    region: string;
    endpoint: string;
    dedicatedOnly: boolean;
  }>;
  const selected = pickNode(nodePool.length ? nodePool : [payload.node], payload.plan, payload.regionHint);
  const body = payload.bodyBase64 ? Buffer.from(payload.bodyBase64, "base64") : undefined;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (target.protocol === "https:") {
        const proxied = await httpsRequestViaProxy({
          url: payload.url,
          method: payload.method,
          headers: payload.headers,
          body,
          agent: getHttpsProxyAgent(selected),
        });

        reply.code(proxied.statusCode);
        Object.entries(proxied.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            reply.header(key, String(value));
          }
        });

        return reply.send(proxied.stream);
      }

      const upstream = await request(payload.url, {
        method: payload.method,
        headers: payload.headers,
        body,
      });

      reply.code(upstream.statusCode);
      Object.entries(upstream.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          reply.header(key, String(value));
        }
      });

      return reply.send(upstream.body);
    } catch (error) {
      lastError = error;
    }
  }

  logger.error({ err: lastError }, "backend_forward_failed");
  return reply.status(502).send({ error: "upstream_unreachable" });
});

const port = Number(process.env.PORT ?? 8080);
app.listen({ host: "0.0.0.0", port }).catch((error) => {
  logger.error({ err: error }, "backend_start_failed");
  process.exit(1);
});
