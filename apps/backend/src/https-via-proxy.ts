import type { IncomingHttpHeaders } from "node:http";
import https from "node:https";
import { URL } from "node:url";
import type { HttpsProxyAgent } from "https-proxy-agent";

export type ProxyHttpResponse = {
  statusCode: number;
  headers: IncomingHttpHeaders;
  stream: NodeJS.ReadableStream;
};

export async function httpsRequestViaProxy(input: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: Buffer;
  agent: HttpsProxyAgent;
}): Promise<ProxyHttpResponse> {
  const target = new URL(input.url);

  return new Promise<ProxyHttpResponse>((resolve, reject) => {
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: input.method,
        headers: input.headers,
        agent: input.agent,
      },
      (res) => {
        resolve({
          statusCode: res.statusCode ?? 502,
          headers: res.headers,
          stream: res,
        });
      },
    );

    req.on("error", reject);
    if (input.body) {
      req.write(input.body);
    }
    req.end();
  });
}
