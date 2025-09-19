# AI Research Agent

A full-stack application that automates research workflows by accepting a topic from users, gathering relevant articles from external APIs, processing the data, and returning structured results with explainable traces.

## Features

- 5-step automated research workflow with detailed logging
- External API integration (NewsAPI, Hacker News)
- Background processing with Bull.js and Redis
- Real-time progress tracking
- Responsive UI with Next.js and Tailwind CSS
- Full Docker containerization

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Local Development
1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
3. Start with Docker:
   ```bash
   docker-compose up --build -d
   ```
4. Run database migrations:
   ```bash
   docker-compose exec backend npm run db:migrate
   ```
5. Access the application:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Database Management

When you modify the database schema in `backend/src/db/schema.ts`:

```bash
# Generate and run migration
docker-compose exec backend npm run db:generate
docker-compose exec backend npm run db:migrate
```

## API Endpoints

- `POST /api/research` - Submit research topic
- `GET /api/research` - List all requests
- `GET /api/research/:id` - Get detailed results with logs

## Research Workflow

5-step automated process:
1. Input Parsing - Validates and stores topic
2. Data Gathering - Fetches articles from external APIs
3. Processing - Extracts top 5 articles and keywords
4. Result Persistence - Saves to database
5. Return Results - Provides structured output with logs

## Deployment

### Docker (Full Stack)
Both frontend and backend run in Docker containers:

1. **VPS Setup**
   ```bash
   # Install Docker
   sudo apt update && sudo apt install docker.io docker-compose

   # Clone and deploy
   git clone <repository-url>
   cd ai-research-agent
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   docker-compose up -d --build
   ```

2. **Cloud Platforms**
   - Backend: Deploy to Render, Railway, or Fly.io
   - Database: Use managed PostgreSQL and Redis services
   - Frontend: Can be deployed alongside backend in Docker

## Technology Stack

**Backend:** Node.js, TypeScript, Express.js, PostgreSQL, Redis, Bull.js
**Frontend:** Next.js, TypeScript, Tailwind CSS
**DevOps:** Docker, GitHub Actions

## Environment Variables

**Backend (.env):**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_research_agent
REDIS_URL=redis://localhost:6379
NEWS_API_KEY=optional_news_api_key
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```