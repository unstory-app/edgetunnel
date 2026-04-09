import { HttpsProxyAgent } from "https-proxy-agent";

type Plan = "free" | "pro" | "enterprise";

export type NodeDescriptor = {
  id: string;
  region: string;
  endpoint: string;
  dedicatedOnly: boolean;
};

const rrState = new Map<string, number>();

export function pickNode(nodes: NodeDescriptor[], plan: Plan, regionHint?: string): NodeDescriptor {
  const eligible = nodes.filter((node) => {
    if (node.dedicatedOnly && plan !== "enterprise") {
      return false;
    }
    return regionHint ? node.region === regionHint : true;
  });

  const pool = eligible.length > 0 ? eligible : nodes;
  if (pool.length === 0) {
    throw new Error("no eligible proxy nodes");
  }
  const key = `${plan}:${regionHint ?? "global"}`;
  const idx = rrState.get(key) ?? 0;
  const selected = pool[idx % pool.length]!;
  rrState.set(key, idx + 1);
  return selected;
}

const proxyAgentPool = new Map<string, HttpsProxyAgent<string>>();

export function getHttpsProxyAgent(node: NodeDescriptor): HttpsProxyAgent<string> {
  const existing = proxyAgentPool.get(node.endpoint);
  if (existing) {
    return existing;
  }

  const created = new HttpsProxyAgent(node.endpoint, {
    keepAlive: true,
    keepAliveMsecs: 15_000,
    maxSockets: 128,
  });
  proxyAgentPool.set(node.endpoint, created);
  return created;
}
