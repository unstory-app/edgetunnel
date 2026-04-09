import Fastify from "fastify";
import { request } from "undici";
import { z } from "zod";
import { logger } from "@edgetunnel/utils";
import { assertAllowedTarget } from "./guard";
import { buildDispatcher, pickNode } from "./routing";
import { verifyPayload } from "./signature";

const app = Fastify({ logger: false });

const routeSchema = z.object({
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

app.get("/health", async () => ({ ok: true, service: "proxy-controller" }));

app.post("/route", async (req, reply) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CONTROLLER_INTERNAL_TOKEN}`) {
    return reply.status(401).send({ error: "unauthorized" });
  }

  const raw = JSON.stringify(req.body ?? {});
  const signature = req.headers["x-edgetunnel-signature"];
  if (typeof signature !== "string" || !verifyPayload(raw, signature, process.env.CONTROLLER_SHARED_SECRET ?? "")) {
    return reply.status(401).send({ error: "invalid signature" });
  }

  const parsed = routeSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "invalid payload" });
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

  const dispatcher = buildDispatcher(selected);
  const body = payload.bodyBase64 ? Buffer.from(payload.bodyBase64, "base64") : undefined;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const upstream = await request(payload.url, {
        method: payload.method,
        headers: payload.headers,
        body,
        dispatcher,
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

  logger.error({ err: lastError }, "proxy_controller_forward_failed");
  return reply.status(502).send({ error: "upstream_unreachable" });
});

const port = Number(process.env.PORT ?? 8080);
app.listen({ host: "0.0.0.0", port }).catch((error) => {
  logger.error({ err: error }, "proxy_controller_start_failed");
  process.exit(1);
});
