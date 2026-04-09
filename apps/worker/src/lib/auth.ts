export type AuthContext = {
    userId: string;
    plan: "free" | "pro" | "enterprise";
};

export async function validateApiKey(apiKey: string, env: Env): Promise<AuthContext | null> {
    if (!apiKey || apiKey.length < 16) {
        return null;
    }

    const cacheKey = `api:${apiKey.slice(0, 8)}`;
    const cached = await env.RATE_LIMIT_KV.get(cacheKey, "json");
    if (cached && typeof cached === "object") {
        return cached as AuthContext;
    }

    const response = await fetch(env.STACKAUTH_VALIDATE_URL, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${env.STACKAUTH_SERVER_TOKEN}`,
        },
        body: JSON.stringify({ apiKey }),
    });

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as {
        valid: boolean;
        userId?: string;
        plan?: "free" | "pro" | "enterprise";
    };

    if (!payload.valid || !payload.userId || !payload.plan) {
        return null;
    }

    const auth: AuthContext = {
        userId: payload.userId,
        plan: payload.plan,
    };

    await env.RATE_LIMIT_KV.put(cacheKey, JSON.stringify(auth), {
        expirationTtl: 60,
    });

    return auth;
}
