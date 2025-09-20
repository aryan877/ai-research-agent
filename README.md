# AI Research Agent

A full-stack application that automates research workflows by accepting a topic from users, gathering relevant articles from external APIs, processing the data, and returning structured results with explainable traces.

## Features

- 5-step automated research workflow with detailed logging
- External API integration (NewsAPI, Hacker News)
- Background processing with Bull.js and Redis
- Real-time progress tracking
- Responsive UI with Next.js and Tailwind CSS
- Production-ready Docker containerization
- CI/CD pipeline with GitHub Actions
- **OpenTelemetry observability** - Full telemetry for AI operations, HTTP requests, and system metrics

## Architecture

- **Frontend**: Next.js deployed on Vercel
- **Backend**: Node.js/Express API with PostgreSQL & Redis
- **Deployment**: Backend on VPS (Hetzner) with Caddy reverse proxy
- **Domain**: `deepresearching.xyz` (frontend) + `api.deepresearching.xyz` (backend)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### Local Development

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd ai-research-agent

   # Copy environment templates
   cp .env.example .env
   # Edit .env with your database credentials

   # Setup backend environment
   cd backend
   cp .env.example .env
   # Add your API keys to backend/.env
   ```

2. **Start services:**
   ```bash
   # Development (includes frontend)
   docker compose up --build -d

   # Production (backend only)
   docker compose -f docker-compose.prod.yml up --build -d
   ```

3. **Run database migrations:**
   ```bash
   docker compose exec backend npm run db:migrate
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Health check: http://localhost:3001/health

### Database Management

When you modify the database schema in `backend/src/db/schema.ts`:

```bash
# Generate and run migration
docker compose exec backend npm run db:generate
docker compose exec backend npm run db:migrate
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/research` - Submit research topic
- `GET /api/research` - List all requests
- `GET /api/research/:id` - Get detailed results with logs
- `GET /api/metrics` - Application metrics

## Research Workflow

5-step automated process:

1. **Input Parsing** - Validates and stores topic
2. **Data Gathering** - Fetches articles from external APIs
3. **Processing** - Extracts top 5 articles and keywords
4. **Result Persistence** - Saves to database
5. **Return Results** - Provides structured output with logs

## Deployment

### Production Setup (Recommended)

**Frontend → Vercel | Backend → VPS**

#### 1. VPS Setup (Hetzner/DigitalOcean)

```bash
# Install dependencies
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
apt install docker-compose-plugin caddy git -y

# Setup application
mkdir -p /app && cd /app
git clone <repository-url> ai-research-agent
cd ai-research-agent

# Environment setup
cp .env.example .env
cp backend/.env.example backend/.env
# Edit both .env files with production values
```

#### 2. Caddy Configuration

```bash
nano /etc/caddy/Caddyfile
```

```caddy
api.deepresearching.xyz {
    reverse_proxy localhost:3001
}
```

```bash
systemctl enable caddy && systemctl start caddy
```

#### 3. Deploy Backend

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

#### 4. Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variable: `NEXT_PUBLIC_API_URL=https://api.deepresearching.xyz/api`
3. Deploy automatically

#### 5. DNS Setup (Cloudflare)

```
A    api    YOUR_VPS_IP    (Proxied)
CNAME @     cname.vercel-dns.com (DNS Only)
CNAME www   cname.vercel-dns.com (DNS Only)
```

### GitHub Actions Setup

Add these secrets to your GitHub repository:

```
VPS_HOST=your-server-ip
VPS_USER=root
VPS_SSH_KEY=<your-private-ssh-key>
```

Auto-deployment on push to main branch.

## Technology Stack

- **Backend**: Node.js, TypeScript, Express.js, PostgreSQL, Redis, Bull.js, Drizzle ORM
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, React 19
- **Infrastructure**: Docker, Caddy, GitHub Actions
- **Observability**: OpenTelemetry with AI SDK telemetry, automatic instrumentation
- **Deployment**: Vercel (Frontend), VPS (Backend), Cloudflare (DNS)

## Environment Variables

### Root `.env` (Docker Compose)
```env
# Database Configuration
POSTGRES_DB=ai_research_agent
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Global Configuration
NODE_ENV=production
```

### Backend `.env` (Application)
```env
# Application
PORT=3001

# External APIs
NEWS_API_KEY=your_news_api_key

# AI Providers (Optional)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Vercel Environment
```env
NEXT_PUBLIC_API_URL=https://api.deepresearching.xyz/api
```

## Observability & Monitoring

### OpenTelemetry Integration

The application includes comprehensive observability through OpenTelemetry:

**Automatic Instrumentation:**
- HTTP requests and Express middleware
- PostgreSQL database operations
- Redis connections
- Node.js system metrics (memory, event loop, V8 heap)

**AI SDK Telemetry:**
- Native OpenTelemetry spans with `experimental_telemetry: { isEnabled: true }`
- Automatic token usage, cost, and duration tracking
- Built-in model and provider identification
- Custom metadata support for request correlation

**Viewing Telemetry Data:**
```bash
# All logs including telemetry
docker compose logs -f backend

# AI SDK telemetry spans only
docker compose logs backend | grep "ai\."

# OpenTelemetry traces and spans
docker compose logs backend | grep -E "(traceId|spanId)"
```

**Telemetry Configuration:**
- Service: `ai-research-backend`
- Exporters: Console (development), extensible for production
- Metrics export interval: 30 seconds
- Location: `backend/tracing.js`

## Commands

```bash
# Development
docker compose up --build -d

# Production (backend only)
docker compose -f docker-compose.prod.yml up --build -d

# Database migrations
docker compose exec backend npm run db:migrate

# View logs
docker compose logs -f backend

# View AI SDK telemetry data
docker compose logs backend | grep "ai\."

# Stop services
docker compose down
```
