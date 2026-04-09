interface Env {
    RATE_LIMIT_KV: KVNamespace;
    USAGE_DB: D1Database;
    STACKAUTH_VALIDATE_URL: string;
    STACKAUTH_SERVER_TOKEN: string;
    REQUEST_SIGNING_SECRET: string;
    CONTROLLER_SHARED_SECRET: string;
    CONTROLLER_INTERNAL_TOKEN: string;
    PROXY_CONTROLLER_URL: string;
    PROXY_NODES_JSON: string;
}
