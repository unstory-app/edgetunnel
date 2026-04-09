type ProxyNode = {
    id: string;
    region: string;
    endpoint: string;
    dedicatedOnly: boolean;
};

const rrMap = new Map<string, number>();

export function pickProxyNode(env: Env, userPlan: "free" | "pro" | "enterprise", regionHint?: string): ProxyNode {
    const nodes = JSON.parse(env.PROXY_NODES_JSON) as ProxyNode[];
    const eligible = nodes.filter((node) => {
        if (node.dedicatedOnly && userPlan !== "enterprise") {
            return false;
        }
        return regionHint ? node.region === regionHint : true;
    });

    const fallback = eligible.length ? eligible : nodes;
    const key = `${userPlan}:${regionHint ?? "global"}`;
    const index = rrMap.get(key) ?? 0;
    const chosen = fallback[index % fallback.length];
    rrMap.set(key, index + 1);

    return chosen;
}
