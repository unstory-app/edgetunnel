# Deployment

This repository contains multiple deployable surfaces:

- `apps/dashboard`: Next.js dashboard intended for Cloudflare Workers
- `apps/worker`: Edge gateway built directly on Cloudflare Workers
- `apps/backend`: Optional Node.js controller for proxy routing
- `apps/cli`: Local developer/client runtime

## 1. Local Environment

Copy the example env file at the repo root:

```bash
cp .env.example .env
```

Populate the required values locally. Keep real credentials in ignored files
such as `.env`, `.dev.vars`, and Wrangler-managed secrets.

## 2. Database Setup

Drizzle reads `DATABASE_URL` from your local environment.

```bash
bunx drizzle-kit push
```

If you need to validate connectivity without applying schema changes:

```bash
bun run typecheck
```

## 3. Cloudflare Authentication

Provide Cloudflare credentials through your shell or secret manager before
running Wrangler commands:

```bash
export CLOUDFLARE_API_TOKEN=<your-api-token>
export CLOUDFLARE_ACCOUNT_ID=<your-account-id>
```

## 4. Worker Secrets

Use Wrangler-managed secrets for sensitive values:

```bash
cd apps/worker
printf '%s' "$REQUEST_SIGNING_SECRET" | bunx wrangler secret put REQUEST_SIGNING_SECRET
printf '%s' "$CONTROLLER_SHARED_SECRET" | bunx wrangler secret put CONTROLLER_SHARED_SECRET
printf '%s' "$CONTROLLER_INTERNAL_TOKEN" | bunx wrangler secret put CONTROLLER_INTERNAL_TOKEN
```

For local development, put the same keys in `apps/worker/.dev.vars`.

## 5. Deploy the Apps

Deploy the edge gateway:

```bash
cd apps/worker
bunx wrangler deploy
```

Deploy the dashboard once its Cloudflare adapter configuration is in place:

```bash
cd apps/dashboard
bunx wrangler deploy
```

## 6. Optional Backend Deployment

If you are running the Node.js proxy controller separately:

```bash
cd apps/backend
bun run build
bun start
```
