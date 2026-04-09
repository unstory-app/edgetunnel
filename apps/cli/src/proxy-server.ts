import http from "node:http";
import { request } from "undici";
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
    const server = http.createServer(async (req, res) => {
        try {
            const target = buildTargetUrl(req);
            const chunks: Buffer[] = [];
            req.on("data", (chunk: Buffer) => chunks.push(chunk));
            await new Promise<void>((resolve) => req.on("end", () => resolve()));
            const body = chunks.length ? Buffer.concat(chunks) : undefined;

            const signingPayload = JSON.stringify({
                method: req.method ?? "GET",
                url: target,
                headers: req.headers,
                bodyHash: body?.toString("base64") ?? "",
                ts: Math.floor(Date.now() / 1000),
            });

            const signature = signPayload(signingPayload, options.signingSecret);
            const upstream = await request(options.workerProxyUrl, {
                method: req.method,
                headers: {
                    ...Object.fromEntries(Object.entries(req.headers).filter(([k]) => k.toLowerCase() !== "host")),
                    "x-api-key": options.apiKey,
                    "x-edgetunnel-target": target,
                    "x-edgetunnel-signature": signature,
                    "content-type": req.headers["content-type"] ?? "application/octet-stream",
                },
                body,
            });

            res.writeHead(upstream.statusCode, upstream.headers as http.OutgoingHttpHeaders);
            for await (const chunk of upstream.body) {
                res.write(chunk);
            }
            res.end();
        } catch (error) {
            const message = error instanceof Error ? error.message : "proxy failure";
            res.writeHead(502, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: message }));
        }
    });

    // HTTPS CONNECT requires full tunneling support; intentionally explicit for now.
    server.on("connect", (_req, socket) => {
        socket.write("HTTP/1.1 501 Not Implemented\\r\\n\\r\\n");
        socket.destroy();
    });

    await new Promise<void>((resolve) => {
        server.listen(options.port, options.host, () => resolve());
    });

    return server;
}
