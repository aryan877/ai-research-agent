# Architecture

## System Overview
- Monorepo containing a Next.js 15 frontend and an Express/TypeScript backend.
- PostgreSQL stores research requests, results, and workflow logs; Drizzle ORM manages schema and migrations.
- Redis + Bull run background jobs that orchestrate AI analysis and data gathering.
- The frontend creates a persistent UUID per browser session and scopes all history queries to that user identifier.

## High-Level Diagram
```mermaid
graph TD
    Browser[Browser\nNext.js App] -->|submit topic + userId| API[/Express REST API/]
    API -->|persist request| DB[(PostgreSQL)]
    API -->|enqueue job| Queue[(Redis/Bull)]
    Queue --> Worker[Background Worker\n(researchJob)]
    Worker -->|fetch articles| Sources[(NewsAPI, HackerNews, Wikipedia)]
    Worker -->|summaries & plans| AI[(Anthropic / OpenAI)]
    Worker -->|store results + logs| DB
    DB -->|filtered by userId| API
    API -->|poll request + results| Browser
```

## Request Lifecycle
1. **Client identity** – `useUserId` generates or reads a UUID from `localStorage` and attaches it to every API request.
2. **Submission** – the frontend calls `POST /api/research` with `{ topic, userId, provider? }`. The backend validates the UUID, persists the request (scoped to `user_id`), and enqueues a Bull job.
3. **Background processing** – the `researchJob` worker logs each workflow step, fetches articles from external sources, and invokes the AI service for summaries, keywords, and research plans.
4. **Persistence** – enhanced results plus workflow logs are committed to PostgreSQL; the job marks the request `completed` or `failed`.
5. **Retrieval** – the frontend polls `GET /api/research/:id?userId=<uuid>` until the request reaches a terminal state. List views call `GET /api/research?userId=<uuid>` to show only the current user’s history.

## Components
### Frontend (`/frontend`)
- **Stack**: Next.js App Router, React 19, TypeScript, Tailwind-styled components.
- **State**: `useUserId` hook maintains the per-browser UUID; components poll the API for status updates.
- **API layer**: `src/lib/api.ts` wraps axios calls, ensuring every request includes `userId`.

### Backend API (`/backend`)
- **Framework**: Express 5 with TypeScript.
- **Routing**: `api/research` and `api/metrics` surface user-facing functionality; AI helpers remain internal services.
- **Persistence**: Drizzle ORM targets PostgreSQL; schema and migrations live under `src/db` and `drizzle/`.
- **Security**: endpoints validate UUID format and forbid access to records that belong to other users.

### Background Jobs & Services
- **Queue**: Bull + Redis defined in `src/utils/queue.ts`.
- **Worker**: `researchJob.ts` drives the workflow, emitting `WorkflowLog` entries for each stage.
- **AI Integration**: `AIService` selects Anthropic or OpenAI providers for summarization and planning.
- **Data Gathering**: `NewsService` queries NewsAPI, Hacker News, and Wikipedia as fallbacks.

### Data Stores
- **PostgreSQL**: primary database; tables `research_requests`, `research_results`, `workflow_logs`.
- **Redis**: transient store for Bull queues and job scheduling.

## Data Model Snapshot
| Table | Purpose | Key Columns |
| --- | --- | --- |
| `research_requests` | User-scoped request metadata | `id`, `topic`, `user_id`, `status`, timestamps |
| `research_results` | AI-enhanced outputs | `id`, `request_id`, `articles`, `keywords`, `enhanced_data` |
| `workflow_logs` | Audit trail for each job stage | `id`, `request_id`, `step`, `status`, `message`, `timestamp` |

## Observability & Metrics
- `WorkflowLogModel` captures each pipeline phase (Input Parsing, Data Gathering, AI Processing, Result Persistence, Error).
- `metrics` routes expose request-level and aggregate metrics derived from persisted data.
- Structured logging (via `morgan` and targeted `console` logs) assists during local debugging.

## Local Development & Deployment
- **Docker Compose** orchestrates PostgreSQL, Redis, backend, and frontend containers for parity with production.
- **Environment**: `.env` files configure API keys (e.g., `NEWS_API_KEY`, AI provider keys) and database URLs.
- **Tooling**: `npm run lint` (frontend), `npm run build` (backend), and `npm run db:migrate` (backend) keep code and schema validated.
- **Migrations**: managed with Drizzle (`drizzle-kit generate/push`) and executed via `src/scripts/migrate.ts`.
