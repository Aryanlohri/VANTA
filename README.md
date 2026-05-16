
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,50:1a1a1a,100:0a0a0a&height=220&section=header&text=VANTA&fontSize=90&fontColor=e8e8e8&animation=fadeIn&fontAlignY=38&desc=AI-Powered%20Code%20Intelligence%20Platform&descAlignY=58&descSize=18&descColor=898989" alt="VANTA Banner" width="100%" />
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-≥20-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://redis.io/"><img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <strong>Push code. Get expert-level feedback in seconds.</strong><br/>
  <sub>Detect bugs, security vulnerabilities, and performance issues — before they reach production. One platform, zero friction.</sub>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Security Model](#-security-model)
- [API Reference](#-api-reference)
- [AI Review Pipeline](#-ai-review-pipeline)
- [Docker](#-docker)
- [Database](#-database)
- [Tech Stack](#-tech-stack)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✦ Overview

**VANTA** is a production-grade, microservice-based platform that performs AI-driven code reviews using Google's **Gemini 2.5 Flash** model. Connect your GitHub repositories, select files or open a Pull Request, and receive instant line-by-line feedback covering bugs, security flaws, performance bottlenecks, and style violations — all scored on a **0–100 quality scale**.

The platform is built with a **security-first philosophy**: encrypted token storage, Redis-backed sessions, inter-service authentication, IDOR protection, and strict ownership enforcement at every layer.

---

## ⚡ Features

### 🔍 Intelligent Code Analysis
Line-by-line AI review with **language-specific expertise** for JavaScript, TypeScript, Python, Java, Go, Rust, and 7+ more languages. Each review produces a quantified **0–100 quality score**, categorized findings by severity, and actionable fix suggestions with improved code snippets.

### 🔗 Deep GitHub Integration
One-click OAuth login and repository connection. Reviews can be triggered from any branch or file. For Pull Requests, users can **manually post AI reviews** directly to the PR as inline comments — with an automatic fallback to general comments if GitHub rejects inline positioning.

### 🛡️ Security-First Architecture
AES-256-GCM encrypted GitHub tokens, Redis-backed sessions with one-time auth codes, HMAC-verified webhooks, shared-secret inter-service auth, strict IDOR protection, input sanitization, and rate limiting. No ports are exposed except the API Gateway and the client.

### ⚙️ Real-Time Processing
Asynchronous review processing via **BullMQ + Redis** queues with WebSocket-powered live progress updates. Watch files get reviewed one-by-one in the dashboard with instant status transitions — no polling required.

### 🎨 Premium Dashboard
A dark-mode, metallic-themed Next.js dashboard featuring a **Monaco code editor** (VS Code engine), animated starfield hero, cinematic loading sequences, and glassmorphism card design. Built for developers who care about aesthetics.

### 💳 Subscription & Billing
Razorpay-powered subscription tiers (Free, Pro, Enterprise) with server-verified webhook payments, usage tracking, and quota enforcement. Seamlessly upgradeable from the dashboard.

---

## 🏗 Architecture

VANTA follows a **microservice architecture** with strict network isolation. Only the API Gateway and Client are publicly accessible — all backend services communicate over Docker's internal DNS.

```
                          +------------------+
                          |   API Gateway    |
                          |    (Express)     |
    +-------------+       |     :3000        |       PUBLIC
    |   Client    | <---> +--------+---------+
    |  (Next.js)  |                |
    |    :3010    |                |
    +-------------+   ============ | ============   INTERNAL
                                   |
              +--------------------+-------------------+
              |                    |                    |
     +--------+-------+  +--------+-------+  +---------+------+
     |  Auth Service   |  |  Repo Service   |  | Review Service  |
     |     :3001       |  |     :3002       |  |     :3003       |
     +--------+-------+  +--------+-------+  +---------+------+
              |                    |                    |
              +---------+----------+---------+---------+
                        |                    |
              +---------+------+   +---------+------+
              |   PostgreSQL   |   |     Redis      |
              |     :5432      |   |     :6379      |
              |  (3 schemas)   |   | (Queue/Cache)  |
              +----------------+   +--------+-------+
                                            |
                                   +--------+-------+
                                   |   AI Service   |
                                   |     :3004      |
                                   |  (Gemini AI)   |
                                   +----------------+
```

### Service Breakdown

| Service | Port | Responsibility |
|:--------|:----:|:---------------|
| **API Gateway** | `3000` | JWT validation, rate limiting, request proxying, CORS |
| **Auth Service** | `3001` | GitHub OAuth, JWT issuance, session management, user profiles |
| **Repository Service** | `3002` | GitHub API integration, repo CRUD, file browsing, PR commenting |
| **Review Service** | `3003` | Review orchestration, WebSocket progress, queue dispatch |
| **AI Service** | `3004` | Gemini prompt engineering, language-specific analysis, structured output |
| **Client** | `3010` | Next.js 16 dashboard, Monaco editor, real-time UI |

---

## 📂 Project Structure

```
vanta/
├── client/                          # Next.js 16 frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Animated landing page
│       │   ├── login/               # GitHub OAuth login
│       │   └── dashboard/
│       │       ├── page.tsx         # Dashboard overview
│       │       ├── repositories/    # Connected repos management
│       │       └── reviews/         # Review list, detail + Monaco editor
│       └── lib/
│           ├── api.ts               # Axios client with auth interceptors
│           └── socket.ts            # WebSocket hook for live updates
│
├── packages/
│   └── shared/                      # Shared types, constants, utilities
│       └── src/
│           ├── constants.ts         # Ports, queues, events, error codes
│           ├── types/               # TypeScript interfaces for all entities
│           ├── errors/              # Custom error classes
│           └── utils/               # Logger (Pino), env validation
│
├── services/
│   ├── api-gateway/                 # Express reverse proxy + middleware
│   ├── auth-service/                # OAuth, JWT, sessions, payments
│   ├── repository-service/          # GitHub API, webhooks, PR reviews
│   ├── review-service/              # Review CRUD, queue consumer, WS
│   └── ai-service/                  # Gemini integration + prompt templates
│       └── src/prompts/
│           ├── base.ts              # Core review prompt scaffold
│           ├── javascript.ts        # JS-specific guidelines
│           ├── typescript.ts        # TS strict typing rules
│           ├── python.ts            # Pythonic patterns
│           ├── java.ts              # Java conventions
│           ├── go.ts                # Go idioms & goroutine safety
│           └── rust.ts              # Ownership, borrowing, unsafe checks
│
├── scripts/
│   └── init-db.sql                  # PostgreSQL schema bootstrapping
│
├── docker-compose.yml               # Production composition
├── docker-compose.dev.yml           # Dev overrides (port exposure)
├── tsconfig.base.json               # Shared TypeScript config
└── package.json                     # NPM workspaces root
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|:-----|:--------|:--------|
| **Node.js** | ≥ 20.0.0 | Runtime |
| **npm** | ≥ 10.0.0 | Package manager |
| **Docker** | Latest | PostgreSQL & Redis containers |
| **GitHub OAuth App** | — | [Create one here](https://github.com/settings/developers) |
| **Gemini API Key** | — | [Get one here](https://aistudio.google.com/app/apikey) |

### 1. Clone & Install

```bash
git clone https://github.com/Aryanlohri/VANTA.git
cd VANTA
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
# GitHub OAuth (create at github.com/settings/developers)
# Homepage URL:    http://localhost:3010
# Callback URL:    http://localhost:3000/api/auth/github/callback
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Generate secure secrets
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_hex_secret
INTERNAL_SERVICE_SECRET=your_32_byte_hex_secret
```

### 3. Start Infrastructure & Services

```bash
# Start everything (Postgres, Redis, all 6 services + client)
npm run dev
```

This single command will:
1. Spin up **PostgreSQL** and **Redis** via Docker Compose
2. Run database migrations automatically
3. Launch all **5 backend microservices** concurrently
4. Start the **Next.js** development server

### 4. Open the Dashboard

```
Frontend:    http://localhost:3010
API Gateway: http://localhost:3000/api
```

---

## 🔐 Security Model

VANTA implements **defense-in-depth** across every layer:

| Layer | Mechanism |
|:------|:----------|
| **Token Storage** | GitHub tokens encrypted with AES-256-GCM before database persistence |
| **Authentication** | JWT with HttpOnly session cookies; Redis-backed with one-time auth codes |
| **Inter-Service** | Shared `INTERNAL_SERVICE_SECRET` validated on every internal API call |
| **Webhooks** | HMAC-SHA256 signature verification on all GitHub webhook payloads |
| **Authorization** | Strict ownership checks (IDOR prevention) on every resource endpoint |
| **Network** | Only Gateway (:3000) and Client (:3010) are publicly exposed |
| **Rate Limiting** | Redis-backed distributed rate limiter on the API Gateway |
| **Input Validation** | Request body sanitization and header injection prevention |

---

## 📡 API Reference

All endpoints are accessed through the API Gateway at `http://localhost:3000/api`.

### Authentication

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/auth/github` | Initiate GitHub OAuth flow |
| `GET` | `/auth/github/callback` | OAuth callback handler |
| `GET` | `/auth/me` | Get current user profile |

### Repositories

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/repos` | List connected repositories |
| `GET` | `/repos/github` | List available GitHub repos |
| `POST` | `/repos/connect` | Connect a repository |
| `DELETE` | `/repos/:id` | Disconnect a repository |
| `GET` | `/repos/:id/files` | Browse repository files |
| `GET` | `/repos/:id/content/:path` | Get file content |

### Reviews

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/reviews` | Create a new AI review |
| `GET` | `/reviews` | List all reviews |
| `GET` | `/reviews/:id` | Get full review with comments |
| `POST` | `/reviews/:id/github` | Post review to GitHub PR |
| `DELETE` | `/reviews/:id` | Delete a review |

### Payments

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/payment/plans` | Get subscription plans |
| `POST` | `/payment/create-order` | Create Razorpay order |
| `POST` | `/payment/verify` | Verify payment signature |
| `GET` | `/payment/usage` | Get current usage & quota |

---

## 🧠 AI Review Pipeline

```
User selects files ──► Review created ──► Jobs queued (BullMQ)
                                                │
                                                ▼
                                       ┌────────────────┐
                                       │   AI Service   │
                                       │                │
                                       │ 1. Detect lang │
                                       │ 2. Load prompt │
                                       │ 3. Call Gemini │
                                       │ 4. Parse JSON  │
                                       └───────┬────────┘
                                               │
                                               ▼
                                 ┌──────────────────────────┐
                                 │    Review Service        │
                                 │                          │
                                 │  • Store comments in DB  │
                                 │  • Compute quality score │
                                 │  • Emit WS event         │
                                 └────────────┬─────────────┘
                                              │
                                              ▼
                                 ┌──────────────────────────┐
                                 │    Client Dashboard      │
                                 │                          │
                                 │  • Live progress bar     │
                                 │  • Monaco editor view    │
                                 │  • [Post to GitHub] btn  │
                                 └──────────────────────────┘
```

Each AI review produces a **structured JSON response** containing:

- **Comments** — line-specific findings with `type`, `severity`, `message`, `suggestion`, and `improved_code`
- **Quality Score** — 0–100 composite score
- **Summary** — human-readable overview of the codebase
- **Positives** — things the code does well
- **Suggestions** — high-level improvement recommendations

### Supported Comment Types

| Type | Description |
|:-----|:------------|
| `bug` | Logic errors, null references, race conditions |
| `security` | SQL injection, XSS, SSRF, auth bypass |
| `performance` | N+1 queries, memory leaks, unnecessary allocations |
| `style` | Naming conventions, formatting, code organization |
| `best_practice` | Design patterns, SOLID principles, idiomatic usage |

### Severity Levels

| Level | Meaning |
|:------|:--------|
| `critical` | Must fix before merge — security holes, data loss |
| `major` | Should fix — significant bugs or performance issues |
| `minor` | Nice to fix — style or minor improvements |
| `info` | Informational — suggestions and positive observations |

---

## 🐳 Docker

### Production

```bash
# Build and start all containers
docker compose up -d --build

# View logs
docker compose logs -f

# Tear down
docker compose down
```

### Development

```bash
# Start only infrastructure (Postgres + Redis)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis

# Run services locally with hot-reload
npm run dev
```

---

## 🗄️ Database

VANTA uses a single PostgreSQL instance with **schema-level isolation**:

| Schema | Service | Tables |
|:-------|:--------|:-------|
| `auth` | Auth Service | `users`, `subscriptions` |
| `repositories` | Repository Service | `repositories` |
| `reviews` | Review Service | `reviews`, `review_files`, `review_comments` |

Run migrations:

```bash
npm run db:migrate
```

---

## 🛠 Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | Next.js 16, React 19, Monaco Editor, Socket.IO Client |
| **API Gateway** | Express, http-proxy-middleware, Redis Rate Limiter |
| **Backend** | Express, Knex.js, BullMQ, Socket.IO, Pino Logger |
| **AI Engine** | Google Gemini 2.5 Flash via `@google/generative-ai` |
| **Database** | PostgreSQL 15 with schema isolation |
| **Cache & Queue** | Redis 7 (sessions, rate limits, job queues) |
| **Auth** | GitHub OAuth 2.0, JWT, AES-256-GCM encryption |
| **Payments** | Razorpay (orders, webhooks, subscription verification) |
| **Infra** | Docker Compose, npm Workspaces, TypeScript 5.7 |
| **Design** | Glassmorphism, CSS Custom Properties, Google Fonts |

---

## 📜 Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start everything (infra + all services + client) |
| `npm run build` | Build all workspaces |
| `npm run db:migrate` | Run all database migrations |
| `npm run docker:up` | Start production Docker stack |
| `npm run docker:down` | Stop Docker stack |
| `npm run docker:build` | Rebuild Docker images |
| `npm run clean` | Remove all `node_modules` |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** your feature branch — `git checkout -b feat/amazing-feature`
3. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/) — `git commit -m 'feat(scope): add amazing feature'`
4. **Push** to the branch — `git push origin feat/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,50:1a1a1a,100:0a0a0a&height=120&section=footer" alt="Footer" width="100%" />
</p>

<p align="center">
  <strong>Shipped by <a href="https://github.com/Aryanlohri">Aryan Lohri</a>. Tested in production. Survived.</strong>
</p>
