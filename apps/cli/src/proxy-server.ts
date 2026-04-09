import http from "node:http";
import { randomUUID } from "node:crypto";
import httpProxy from "http-proxy";
import { ProxyAgent } from "proxy-agent";
import { signPayload } from "./signature";

type ProxyServerOptions = {
    host: string;
    port: number;
    workerProxyUrl: string;
    apiKey: string;
    signingSecret: string;
};

function buildTargetUrl(req: http.IncomingMessage): string {
    if (!req.url) {
        throw new Error("Request URL missing");
    }

    if (req.url.startsWith("http://") || req.url.startsWith("https://")) {
        return req.url;
    }

    const host = req.headers.host;
    if (!host) {
        throw new Error("Host header missing");
    }

    return `http://${host}${req.url}`;
}

export async function startProxyServer(options: ProxyServerOptions): Promise<http.Server> {
    const upstreamAgent = new ProxyAgent();
    const proxy = httpProxy.createProxyServer({
        target: options.workerProxyUrl,
        changeOrigin: true,
        xfwd: true,
        secure: true,
        ignorePath: true,
        prependPath: false,
        agent: upstreamAgent,
    });

    proxy.on("error", (error, _req, res) => {
        if (!res || !("writeHead" in res)) {
            return;
        }

        const message = error instanceof Error ? error.message : "proxy failure";
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: message }));
    });

    proxy.on("proxyReq", (proxyReq, req) => {
        const target = buildTargetUrl(req as http.IncomingMessage);
        const ts = String(Math.floor(Date.now() / 1000));
        const nonce = randomUUID();
        const signaturePayload = [req.method ?? "GET", target, ts, nonce].join("\n");
        const signature = signPayload(signaturePayload, options.signingSecret);

        proxyReq.path = "/proxy";
        proxyReq.setHeader("x-api-key", options.apiKey);
        proxyReq.setHeader("x-edgetunnel-target", target);
        proxyReq.setHeader("x-edgetunnel-ts", ts);
        proxyReq.setHeader("x-edgetunnel-nonce", nonce);
        proxyReq.setHeader("x-edgetunnel-signature", signature);
        proxyReq.setHeader("x-forwarded-proto", "http");
        proxyReq.setHeader("x-edgetunnel-client", "cli");
    });

    const server = http.createServer((req, res) => {
        proxy.web(req, res);
    });

    server.on("connect", (_req, socket) => {
        socket.write("HTTP/1.1 501 Not Implemented\r\n\r\n");
        socket.destroy();
    });

    await new Promise<void>((resolve) => {
        server.listen(options.port, options.host, () => resolve());
    });

    return server;
}
