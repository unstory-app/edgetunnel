import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { proxyRoute } from "./routes/proxy";
import { usageRoute } from "./routes/usage";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ service: "edgetunnel-worker", ok: true }));
app.route("/auth", authRoute);
app.route("/proxy", proxyRoute);
app.route("/usage", usageRoute);

app.onError((err, c) => {
	console.error("worker_error", err);
	return c.json({ error: "internal_error" }, 500);
});

export default app;
