# Development Guide

## Project Structure

```
ai-research-agent/
├── backend/             # Node.js/Express API with TypeScript
├── frontend/           # Next.js application with TypeScript
└── docker-compose.yml  # Local development setup
```

## Quick Start

```bash
# Start full stack
docker-compose up --build

# Backend development
cd backend && npm run dev

# Frontend development
cd frontend && npm run dev
```

## Code Conventions

### Backend

- MVC pattern with service layer
- TypeScript strict mode
- Parameterized database queries
- Consistent JSON responses

### Frontend

- Next.js App Router
- Functional components with hooks
- Tailwind CSS only (no custom CSS)
- API calls in `/lib/api.ts`

## API Endpoints

- `POST /api/research` - Submit research request
- `GET /api/research` - List all requests
- `GET /api/research/:id` - Get results with logs
- `GET /health` - Health check

## 5-Step Workflow

1. Input Parsing - Validate and store topic
2. Data Gathering - Fetch from external APIs
3. Processing - Extract articles and keywords
4. Result Persistence - Save to database
5. Return Results - Update status and logs

## Environment Variables

**Backend (.env):**

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_research_agent
REDIS_URL=redis://localhost:6379
NEWS_API_KEY=optional
```

**Frontend (.env.local):**

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Deployment

- **Frontend + Backend**: Docker containers
- **Database**: Managed PostgreSQL and Redis
- **Platforms**: Render, Railway, Fly.io

## Development Checklist

- [ ] TypeScript compiles without errors
- [ ] Application builds successfully (`npm run build`)
- [ ] ESLint passes
- [ ] Docker builds successfully
- [ ] API endpoints work correctly
