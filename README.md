# EdgeTunnel

EdgeTunnel is a Cloudflare Worker-powered proxy SaaS with a one-command local tunnel:

```bash
edgetunnel start --api-key <key> --signing-secret <secret>
```

Traffic path:

Client -> CLI local proxy (`127.0.0.1:8787`) -> Worker (`/proxy`) -> Backend controller -> rotating proxy nodes -> internet.

## Monorepo Layout

```text
/apps
  /worker      Cloudflare Worker + Hono
  /cli         Local proxy daemon and system proxy controls
  /backend     Proxy controller service (Node.js)
  /dashboard   Next.js 15 App Router dashboard

/packages
  /types       Shared Zod schemas and TypeScript types
  /utils       Logging and common helpers
  /config      Drizzle schema + DB config
```

## Requirements

- Bun 1.3+
- Node.js 22+
- Cloudflare account + Wrangler
- PostgreSQL 15+

## Install

```bash
bun install
```

## Local Development

### Worker

```bash
cd apps/worker
bun run cf-typegen
bun run dev
```

### Backend

```bash
cd apps/backend
cp .env.example .env
bun run dev
```

### CLI

```bash
cd apps/cli
bun run dev start --api-key <key> --signing-secret <secret> --worker-url https://edgetunnel.com/proxy
```

### Dashboard

```bash
cd apps/dashboard
bun run dev
```

## Deployment

### Cloudflare Worker

```bash
cd apps/worker
wrangler deploy
```

### Backend

Docker:

```bash
docker build -f apps/backend/Dockerfile -t edgetunnel-backend .
docker run --env-file apps/backend/.env.example -p 8080:8080 edgetunnel-backend
```

PM2:

```bash
cd apps/backend
bun run build
pm2 start ecosystem.config.cjs
```

## Security Notes

- API key validation on every `/proxy` request via StackAuth introspection.
- Per-user edge rate limit backed by Cloudflare KV.
- Signed CLI -> Worker and Worker -> Backend payloads.
- Domain/IP guardrails to block SSRF-style abuse.

## Limitations

- HTTP/HTTPS proxying only.
- Full HTTPS CONNECT tunneling in CLI is currently not implemented.
