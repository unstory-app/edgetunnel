# EdgeTunnel Worker

Cloudflare Worker edge gateway built with Hono.

## Commands

- `bun run dev`
- `bun run deploy`
- `bun run test`

## Bindings

Configure these in `wrangler.jsonc`:

- `RATE_LIMIT_KV` (KV)
- `USAGE_DB` (D1)

Secrets are configured through `.dev.vars` (local) and `wrangler secret put` (remote):

- `STACKAUTH_SERVER_TOKEN`
- `REQUEST_SIGNING_SECRET`
- `CONTROLLER_SHARED_SECRET`
- `CONTROLLER_INTERNAL_TOKEN`
