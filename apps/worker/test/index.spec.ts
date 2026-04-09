import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src";

describe("Hello World user worker", () => {
	describe("request for /", () => {
		it("returns health payload (unit style)", async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>(
				"http://example.com/"
			);
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ service: "edgetunnel-worker", ok: true });
		});

		it("returns health payload (integration style)", async () => {
			const request = new Request("http://example.com/");
			const response = await SELF.fetch(request);
			expect(response.status).toBe(200);
		});
	});
});
