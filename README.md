# 🚀 EdgeTunnel

A one-command, system-wide proxy tool powered by Cloudflare Workers with rotating global IPs.

---

## 📋 Table of Contents

- [Vision](#-vision)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Development](#-development)
- [Architecture](#-architecture)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

---

## 🌐 Vision

EdgeTunnel routes all your system traffic through Cloudflare Workers with zero manual configuration. One command gives you:

- Global IP rotation across 100+ countries
- Automatic system proxy configuration (macOS/Windows/Linux)
- Enterprise-grade authentication and rate limiting
- Smart geo-routing (India user → India proxy, etc.)

```
edgetunnel start
```

That's it. All your traffic now flows through the EdgeTunnel network.

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and Bun 1.3+
- Cloudflare account (for Worker deployment)
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/edgetunnel.git
cd edgetunnel

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# See Configuration section below
```

### Build

```bash
# Build all packages
bun run build

# Type-check and lint
bun run typecheck
bun run lint
```

### Start Developing

```bash
# Run all apps in parallel
bun run dev

# Or run specific app
cd apps/worker && bun run dev
cd apps/backend && bun run dev
cd apps/cli && bun run dev
```

---

## 🛠️ Usage

### CLI Commands

```bash
# Start EdgeTunnel (routes all system traffic)
edgetunnel start \
  --api-key <your-api-key> \
  --signing-secret <your-signing-secret> \
  --worker-url https://edgetunnel.com/proxy

# Stop and restore original proxy settings
edgetunnel stop

# Check status
edgetunnel status
```

### Operating Modes

**Full System Mode** (default)
- Routes ALL system/browser traffic
- Auto-configures OS proxy settings

**Browser Only**
```bash
edgetunnel start --browser
```
- Only configures browser proxy (Chrome/Firefox/Edge)

**Manual Mode**
```bash
edgetunnel start --manual
```
- Doesn't touch system settings
- You manually set browser/system proxy to `localhost:3000`

### Getting an API Key

EdgeTunnel uses Stack Auth for authentication:

1. Sign up at [Stack Auth](https://stack-auth.com)
2. Create a new project
3. Copy Project ID and Server Key
4. Use the Server Key as your API key

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in all required variables:

#### Database
```bash
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

We recommend [Neon](https://neon.tech) for serverless Postgres.

#### Stack Auth
```bash
NEXT_PUBLIC_STACK_PROJECT_ID="your-project-id"
STACK_SECRET_SERVER_KEY="ssk_your_secret_key"
```

#### Cloudflare Worker
```bash
REQUEST_SIGNING_SECRET="random-32-char-secret"
CONTROLLER_SHARED_SECRET="another-secret"
CONTROLLER_INTERNAL_TOKEN="internal-auth-token"
```

#### Optional Services
```bash
# Cloudflare KV for rate limiting
RATE_LIMIT_KV_ID="your-kv-id"

# Cloudflare D1 for usage logs
USAGE_DB_ID="your-d1-database-id"
```

### Database Setup

```bash
# Generate Prisma client
cd packages/db && bun db:generate

# Run migrations
cd packages/config && bun db:migrate

# Push schema changes
cd packages/config && bun db:push
```

---

## 🏗️ Architecture

### Repository Structure

```
edgetunnel/
├── apps/
│   ├── cli/          # System proxy daemon (local)
│   ├── worker/       # Cloudflare Worker (edge)
│   ├── backend/      # Proxy controller (server)
│   └── dashboard/    # Web dashboard (Next.js)
├── packages/
│   ├── types/        # TypeScript schemas (Zod)
│   ├── utils/        # Shared utilities
│   ├── db/           # Prisma client
│   └── config/       # Drizzle ORM schema
├── .env.example      # Environment template
├── LICENSE           # MIT License
└── README.md
```

### Request Flow

```
User Request
    ↓
System Proxy (localhost:3000)
    ↓
CLI Daemon (signs request)
    ↓
Cloudflare Worker (auth + rate limit)
    ↓
Proxy Controller (selects node)
    ↓
Proxy Node (geographically optimal)
    ↓
Target Website
    ↓
Response (return path)
```

### Components Deep Dive

**CLI** (`apps/cli`)
- HTTP proxy server using `http-proxy`
- OS proxy configuration via `system-proxy` module
- Request signing with HMAC
- Daemon process management

**Worker** (`apps/worker`)
- Hono framework on Cloudflare Workers
- API key validation via Stack Auth
- Rate limiting using KV (optional)
- Smart node selection based on user location
- Request/response streaming

**Backend** (`apps/backend`)
- Fastify server
- `https-proxy-agent` for HTTPS CONNECT tunneling
- Node pooling with round-robin load balancing
- Usage logging to D1 (optional)

**Dashboard** (`apps/dashboard`)
- Next.js 15 with App Router
- Usage metrics and API key management
- Stack Auth authentication

---

## 🧪 Testing

```bash
# Run all tests
bun run test

# Specific app tests
cd apps/worker && bun run test
cd apps/backend && bun run test

# Watch mode
cd apps/worker && bunx vitest --watch

# Coverage report
bun run test --coverage
```

### Test Structure

```
apps/
├── worker/
│   └── test/
│       ├── index.spec.ts
│       └── env.d.ts
└── backend/
    └── test/ (add your tests here)
```

---

## 🚀 Deployment

### 1. Cloudflare Worker

```bash
cd apps/worker

# Authenticate (one-time)
bunx wrangler login

# Deploy to production
bunx wrangler deploy

# Deploy to preview
bunx wrangler deploy --env preview

# Generate types after binding changes
bunx wrangler types
```

#### Worker Configuration

Edit `apps/worker/wrangler.jsonc`:

```json
{
  "name": "edgetunnel-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-09",
  "vars": {
    "PROXY_CONTROLLER_URL": "https://your-backend.com",
    "PROXY_NODES_JSON": "[...]",
    "STACKAUTH_VALIDATE_URL": "https://api.stack-auth.com/v1/introspect"
  }
}
```

### 2. Backend (Proxy Controller)

```bash
cd apps/backend

# Build
bun run build

# Start
PORT=8080 bun start

# Or with PM2
pm2 start dist/index.js --name edgetunnel-backend
```

#### Backend Environment

Set these in your deployment environment:

```bash
DATABASE_URL="postgresql://..."
CONTROLLER_SHARED_SECRET="secret"
CONTROLLER_INTERNAL_TOKEN="token"
PROXY_NODES_JSON='[{"id":"node-1","region":"us","endpoint":"http://node:8080","dedicatedOnly":false}]'
```

### 3. CLI Distribution

```bash
cd apps/cli

# Build
bun run build

# Package for npm
npm pack

# Publish (maintainers only)
npm publish
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Getting started guide
- Code style guidelines
- Pull request process
- Testing requirements
- Architecture overview

### Quick Links

- [Issue Tracker](https://github.com/your-username/edgetunnel/issues)
- [Feature Requests](https://github.com/your-username/edgetunnel/discussions)
- [Security Policy](SECURITY.md)

---

## 🔐 Security

### Design Principles

1. **Zero Trust** - Every request is authenticated
2. **Least Privilege** - Secrets isolated via env vars
3. **Defense in Depth** - Multiple auth layers (API key → Worker → Controller)
4. **Auditability** - All requests logged with userId, IP, timestamp

### Threat Model

- **SSRF Prevention** - Domain/IP blocklist in `guard.ts`
- **Replay Attacks** - Timestamp + nonce verification
- **MITM** - HTTPS everywhere + request signing
- **Abuse** - Per-user rate limiting + API key revocation

### Reporting Vulnerabilities

Security issues should be reported privately to security@edgetunnel.com.

---

## 📊 Roadmap

- [ ] WireGuard integration (true VPN mode)
- [ ] Desktop GUI application (Electron/Tauri)
- [ ] Browser extension
- [ ] AI-powered routing optimization
- [ ] IPv6 support
- [ ] SOCKS5 proxy support
- [ ] Mobile apps (iOS/Android)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for full text.

---

## 🙏 Acknowledgments

Built on the shoulders of giants:

- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge computing platform
- [Stack Auth](https://stack-auth.com/) - Authentication
- [Hono](https://hono.dev/) - Web framework
- [Fastify](https://www.fastify.io/) - Backend server
- [Drizzle ORM](https://orm.drizzle.team/) - Database toolkit
- [Prisma](https://prisma.io) - ORM
- [Bun](https://bun.sh/) - JavaScript runtime

---

**Star ⭐ this repo if you find it useful!**

Follow us on Twitter [@edgetunnel](https://twitter.com/edgetunnel) for updates.
