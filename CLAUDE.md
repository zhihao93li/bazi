# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

八字算命 API 服务 (Bazi Fortune-telling API) - A full-stack application with a Hono backend and React frontend for Chinese astrology (八字) calculations and AI-powered fortune analysis.

## Tech Stack

- **Backend**: Hono (Node.js) + TypeScript + Prisma ORM + PostgreSQL
- **Frontend**: React 18 + Vite + Ant Design + TanStack Query
- **AI**: OpenAI API for fortune analysis
- **Payments**: Stripe integration
- **Runtime**: Node.js >= 22.12.0

## Common Commands

### Backend (root directory)
```bash
npm run dev              # Development with hot reload
npm run build            # Build for production (generates Prisma client)
npm start                # Production start (includes db push)
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run lint             # ESLint
npm run db:studio        # Open Prisma Studio
npm run db:push          # Push schema to database
```

### Frontend (frontend/ directory)
```bash
cd frontend
npm run dev              # Vite dev server
npm run build            # Production build
```

## Architecture

### Backend Structure (`src/`)
- **`index.ts`** - Application entry point, sets up Hono app with middleware, routes, and graceful shutdown
- **`routes/`** - API route handlers (auth, bazi, fortune, payment, points, reports, subjects, themes, tasks, admin)
- **`lib/`** - Business logic modules:
  - `ai/` - OpenAI integration for fortune analysis
  - `auth/` - JWT authentication
  - `bazi/` - Chinese astrology calculations (uses lunar-typescript)
  - `payment/` - Stripe payment processing
  - `points/` - Points/credits system
  - `tasks/` - Async task queue (embedded or standalone worker mode)
  - `db/` - Database sync and bootstrap
- **`middleware/`** - JWT auth middleware
- **`generated/`** - Prisma generated client

### Key Patterns
- Routes use Hono's routing with `/api/*` prefix
- JWT Bearer token authentication via `Authorization` header
- Graceful shutdown with resource cleanup (`lib/shutdown.ts`)
- Environment-based config via dotenv-flow (`.env`, `.env.development`, `.env.test`, `.env.production`)
- Task processing supports two modes: `WORKER_MODE=embedded` (default) or `WORKER_MODE=standalone`

### Database Models (Prisma)
Core entities: User, Subject (测算对象), FortuneReport, ThemeAnalysis, PointsAccount, PaymentOrder, Task

### Frontend Structure (`frontend/src/`)
- React SPA with react-router-dom
- Ant Design UI components
- TanStack Query for data fetching
- Framer Motion for animations

## Testing

Tests use Vitest with `.env.test` configuration. Path alias `@/*` maps to `src/*`.

```bash
npm test                    # Run all tests once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

## Environment Variables

Key variables (see `.env.example` for full list):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `OPENAI_API_KEY` / `OPENAI_BASE_URL` - AI service
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Payments
- `CORS_ORIGIN` / `FRONTEND_URL` - CORS and redirect URLs
- `NODE_ENV` - development/test/production

## Deployment

- **Backend**: Zeabur (auto-deploys via zeabur.json, runs migrations)
- **Frontend**: Cloudflare Pages (root: `frontend`, build: `npm run build`, output: `dist`)
- Health check endpoint: `/health`
