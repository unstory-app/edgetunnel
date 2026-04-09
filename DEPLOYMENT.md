# EdgeTunnel CLI Setup & Deployment

## Environment Setup

### 1. Worker Environment
Create `.dev.vars` in `apps/worker/`:
```bash
STACKAUTH_SERVER_TOKEN=<from Stack console>
REQUEST_SIGNING_SECRET=<generate secure random>
CONTROLLER_SHARED_SECRET=<generate secure random>
CONTROLLER_INTERNAL_TOKEN=<generate secure random>
```

### 2. Backend Environment
Create `.env` in `apps/backend/`:
```bash
PORT=8080
CONTROLLER_INTERNAL_TOKEN=<match worker token>
CONTROLLER_SHARED_SECRET=<match worker secret>
PROXY_NODES_JSON=[{"id":"node-us-east","region":"us","endpoint":"http://proxy:8080","dedicatedOnly":false}]
```

### 3. Cloudflare Deployment
Export credentials:
```bash
export CLOUDFLARE_API_TOKEN=cs9y88_5LrxbuPJVH-VgZf61z0LHfzWQajyaexZc
export CLOUDFLARE_ACCOUNT_ID=091539408595ba99a0ef106d42391d5b
```

## Database Setup

Run migrations:
```bash
cd packages/config
bun run build
npx drizzle-kit push
```

## Deploy to Cloudflare

```bash
cd apps/worker
wrangler deploy
```
