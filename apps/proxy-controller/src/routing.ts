import { ProxyAgent } from "undici";

type Plan = "free" | "pro" | "enterprise";

type NodeDescriptor = {
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
  const key = `${plan}:${regionHint ?? "global"}`;
  const idx = rrState.get(key) ?? 0;
  const selected = pool[idx % pool.length];
  rrState.set(key, idx + 1);
  return selected;
}

export function buildDispatcher(node: NodeDescriptor): ProxyAgent {
  return new ProxyAgent(node.endpoint);
}
