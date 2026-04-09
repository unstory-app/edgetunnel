# 🚀 Project Name: **EdgeTunnel**

A one-command, system-wide proxy tool powered by Cloudflare Workers.

---

# 🌐 Vision (What Makes This Powerful)

EdgeTunnel works like this:

```bash
edgetunnel start
```

And instantly:

* All your system/browser traffic is routed through EdgeTunnel
* No manual proxy config required
* No complex setup
* One command → full proxy experience

---

# ⚡ User Experience (Ultra Simple)

## Install

```bash
npm install -g edgetunnel
```

## Start (AUTO MODE)

```bash
edgetunnel start
```

What happens automatically:

* Starts local proxy server
* Configures system proxy (Mac/Windows/Linux)
* Routes traffic via EdgeTunnel network

---

## Stop

```bash
edgetunnel stop
```

* Restores original network settings

---

## Uninstall

```bash
npm uninstall -g edgetunnel
```

---

# 🧠 How "Auto Proxy" Works (Important)

EdgeTunnel uses:

### 1. Local Proxy Server

Runs on:

```
localhost:3000
```

### 2. System Proxy Injection

CLI automatically sets:

* macOS → networksetup
* Windows → registry
* Linux → environment variables

So ALL apps route traffic through:

```
localhost:3000 → EdgeTunnel
```

---

# 🌍 Architecture (Detailed)

## Full Flow

Client App (Browser / System)
↓
Local Proxy (CLI running on device)
↓
Cloudflare Worker (edgetunnel.com/proxy)
↓
Routing Engine
↓
Proxy Controller (VPS)
↓
Rotating Proxy Nodes (Global IPs)
↓
Internet
↓
Response back same path

---

# ⚙️ Tech Stack

## Edge Layer

* Cloudflare Workers
* Cloudflare KV (rate limiting)
* Cloudflare D1 (user DB)

## CLI (Core Magic)

* Node.js
* HTTP proxy server (http-proxy / undici)
* OS-level proxy control scripts

## Backend

* Node.js / Go (Proxy Controller)

## Infra

* VPS nodes (multi-region)

## Cache / Speed

* Redis

---

# 🔐 Security Design

* HTTPS everywhere
* API key authentication
* Signed requests from CLI
* Abuse detection
* Domain filtering

---

# 🔄 Smart Routing Logic

Worker decides:

* Best region
* Load balancing
* User plan (free vs pro)

Example:

```
India user → India proxy
Pro user → premium IP pool
```

---

# 🌐 Public Proxy Endpoint

All traffic flows through:

```
https://edgetunnel.com/proxy
```

Worker acts as:

* Gateway
* Auth layer
* Router

---

# 💻 CLI Internal Flow

## Step-by-step

1. User runs `edgetunnel start`
2. CLI:

   * Starts local proxy server
   * Sets system proxy automatically
3. Any app request → localhost
4. CLI forwards → edgetunnel.com/proxy
5. Worker routes → best proxy node
6. Node fetches data
7. Response returned to user

---

# 🧪 Example Request Flow

```bash
User opens Google
↓
Request → localhost:3000
↓
Forward → edgetunnel.com/proxy
↓
Worker → US proxy node
↓
Google sees US IP
```

---

# 🧠 Modes (Important Feature)

## 1. Full System Mode (default)

```bash
edgetunnel start
```

→ ALL traffic proxied

---

## 2. Browser Only Mode

```bash
edgetunnel start --browser
```

→ Only sets proxy for browser

---

## 3. Manual Mode

```bash
edgetunnel start --manual
```

User sets proxy manually:

```
localhost:3000
```

---

# 🔄 IP Rotation

* Per request rotation
* Sticky sessions (optional)
* Geo targeting

---

# 📊 Rate Limits

| Plan       | Limit     |
| ---------- | --------- |
| Free       | 1K/day    |
| Pro        | 100K/day  |
| Enterprise | Unlimited |

---

# 🚀 Deployment

## Worker

```bash
wrangler deploy
```

## Backend

```bash
node server.js
```

---

# ⚠️ Important Limitations

* Not a true VPN (no TCP/UDP tunneling)
* Works primarily for HTTP/HTTPS
* Some apps may bypass system proxy

---

# 🔥 Future Upgrades

* WireGuard integration (real VPN mode)
* Desktop app (GUI)
* Chrome extension
* AI routing optimization

---

# 🧠 Final Summary

EdgeTunnel =

* One command UX
* Automatic system proxy
* Cloudflare-powered routing
* Global rotating IP network

👉 "Run once. Proxy everything."
