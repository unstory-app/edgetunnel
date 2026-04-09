# Contributing to EdgeTunnel

Thank you for your interest in contributing to EdgeTunnel! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check if the bug has already been reported in Issues
2. Ensure you're using the latest version
3. Collect relevant information (logs, reproduction steps, environment details)

Submit bugs using the bug report template with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

### Suggesting Features

Feature suggestions are welcome! Please:
1. Open an issue with "Feature Request" label
2. Describe the feature and its use case
3. Explain why it would benefit the project

### Pull Requests

#### Prerequisites
- Node.js 18+ and Bun installed
- Familiarity with our codebase architecture

#### Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/edgetunnel.git`
3. Install dependencies: `bun install`
4. Copy `.env.example` to `.env` and configure environment variables

#### Development Workflow
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes following our code style
3. Add tests if applicable
4. Ensure all checks pass: `bun run lint && bun run typecheck`
5. Commit with clear, descriptive messages
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request against `main`

#### Pull Request Guidelines
- Keep PRs focused on a single change
- Update documentation if needed
- Include tests for new features/bug fixes
- Ensure CI passes
- Request review from maintainers

### Code Style

#### TypeScript
- Use strict mode
- Prefer explicit types over inference for public APIs
- Use 2-space indentation
- No semicolons (consistent with repo style)

#### Imports
```typescript
// External packages first
import { something } from "external-package";

// Internal workspace packages second
import { util } from "@edgetunnel/utils";

// Relative imports last
import { local } from "./local";
```

#### Naming
- `camelCase` for variables, functions, methods
- `PascalCase` for classes, types, interfaces
- `UPPER_SNAKE_CASE` for constants

### Architecture Overview

EdgeTunnel consists of three main components:

1. **CLI** (`apps/cli`) - System proxy daemon
2. **Worker** (`apps/worker`) - Cloudflare Workers edge gateway
3. **Backend** (`apps/backend`) - Proxy controller server

Shared packages:
- `@edgetunnel/types` - TypeScript type definitions
- `@edgetunnel/utils` - Shared utilities
- `@edgetunnel/db` - Database client (Prisma)
- `@edgetunnel/config` - Drizzle ORM schema and config

### Testing

```bash
# Run all tests
bun run test

# Run tests for specific app
cd apps/worker && bun run test

# Run with coverage
cd apps/worker && bunx vitest --coverage
```

### Building

```bash
# Build all packages
bun run build

# Build specific app
cd apps/cli && bun run build
```

### Deployment

#### Worker (Cloudflare)
```bash
cd apps/worker
bunx wrangler deploy
```

#### Backend
```bash
cd apps/backend
bun run build
bun start
```

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for helping improve EdgeTunnel! 🚀
