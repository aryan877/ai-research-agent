# Architecture

## System Overview

AI Research Agent with frontend, backend, and data processing layers.

## Components

### Frontend (`/frontend`)

- **Stack**: Next.js 15, TypeScript, Tailwind CSS
- **Pattern**: App Router, component-based architecture
- **Features**: SSR, responsive design, real-time updates

### Backend (`/backend`)

- **Stack**: Node.js, TypeScript, Express.js, PostgreSQL, Redis, Bull.js
- **Pattern**: MVC with Service Layer
- **Structure**:
  ```
  src/
  ├── controllers/    # HTTP handlers
  ├── models/        # Database queries
  ├── services/      # Business logic
  ├── routes/        # API routes
  ├── jobs/         # Background processors
  └── utils/        # Database utilities
  ```

### Database

- **PostgreSQL**: Primary storage with UUID keys, JSONB columns
- **Redis**: Job queue management with Bull.js

## Data Flow

```
User Input → Frontend → Backend API → Database → Job Queue → Background Processing → Result Storage → Frontend Update
```

## Key Design Decisions

**Technology Choices**:

- Node.js: Unified TypeScript across stack
- PostgreSQL: ACID compliance and data integrity
- Docker: Consistent environment and easy deployment

**Architecture Pattern**:

- Monorepo for simplified development
- REST API for simplicity
- Background jobs for async processing

## Development

- **Local**: Docker Compose for full stack
- **Testing**: TypeScript, ESLint, Jest
- **Deployment**: Docker containers
