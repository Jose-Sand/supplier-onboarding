<div align="center">

# Supplier Onboarding Platform

![Build](https://img.shields.io/github/actions/workflow/status/andresjose423/supplier-onboarding/ci.yml?branch=main&label=build&style=flat-square)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)

**Monorepo for managing supplier onboarding workflows through event-driven microservices.**

</div>

---

## Architecture Overview

The platform is built on **Hexagonal Architecture (Ports & Adapters)** combined with **Domain-Driven Design** and an **event-driven** communication model between microservices.

Each service owns its domain, persists its own data, and communicates exclusively through domain events published to RabbitMQ — no direct service-to-service calls.

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Supplier Onboarding Platform                      │
│                                                                        │
│   ┌──────────────────┐   supplier.registered   ┌──────────────────┐  │
│   │  supplier-service│────────────────────────▶│    RabbitMQ      │  │
│   │  :3001           │   supplier.approved      │  topic exchange  │  │
│   │                  │   supplier.rejected      │                  │  │
│   │  - Register      │                          └────────┬─────────┘  │
│   │  - Approve       │                                   │            │
│   │  - Reject        │              supplier.registered  │            │
│   │  - Suspend       │                                   ▼            │
│   └────────┬─────────┘                        ┌──────────────────┐   │
│            │ supplier.registered               │checklist-service │   │
│            │                                   │  :3000           │   │
│            ▼                                   │                  │   │
│   ┌──────────────────┐                         │  - CreateChecklist│  │
│   │   PostgreSQL     │◀────────────────────────│  - CompleteTask  │   │
│   │  supplier_db     │  Prisma                 │  - GetProgress   │   │
│   │  checklist_db    │◀────────────────────────│                  │   │
│   └──────────────────┘                         └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Hexagonal Architecture per service

```
           ┌──────────────────────────────────────┐
           │            HTTP / RabbitMQ            │  ← Driving adapters
           └──────────────────┬───────────────────┘
                              │
           ┌──────────────────▼───────────────────┐
           │          Application Layer            │
           │         (Use Cases / Commands)        │
           └──────────────────┬───────────────────┘
                              │
           ┌──────────────────▼───────────────────┐
           │            Domain Layer               │  ← Zero dependencies
           │   Entities · Value Objects · Events  │
           └──────────────────┬───────────────────┘
                              │
           ┌──────────────────▼───────────────────┐
           │         Infrastructure Layer          │
           │   Prisma · RabbitMQ · Redis           │  ← Driven adapters
           └──────────────────────────────────────┘
```

---

## Monorepo Structure

```
supplier-onboarding/
├── checklist-service/          # Manages onboarding checklists per supplier
├── supplier-service/           # Manages supplier lifecycle (register/approve/reject)
├── infra/
│   └── postgres/init.sql       # Creates both databases on first start
├── docker-compose.yml          # Full stack orchestration
├── docker-compose.override.yml # Dev overrides (hot reload, debug ports)
├── Makefile                    # Developer shortcuts
└── .github/workflows/ci.yml   # CI/CD pipeline for both services
```

---

## Services

| Service | Port | Responsibility |
|---|---|---|
| `supplier-service` | 3001 | Supplier lifecycle: register, approve, reject, suspend |
| `checklist-service` | 3000 | Checklist management per supplier |
| PostgreSQL | 5432 | Persistent storage (one DB per service) |
| RabbitMQ | 5672 / 15672 | Event bus between services |
| Redis | 6379 | Cache (reserved for future use) |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and docker-compose
- [Node.js 20+](https://nodejs.org/)
- [GNU Make](https://www.gnu.org/software/make/) *(optional)*

### Run locally

```bash
# 1. Clone the repository
git clone https://github.com/andresjose423/supplier-onboarding.git
cd supplier-onboarding

# 2. Set up environment variables for each service
cp checklist-service/.env.example checklist-service/.env
cp supplier-service/.env.example supplier-service/.env

# 3. Start all infrastructure (PostgreSQL, RabbitMQ, Redis + both services)
docker compose up -d

# 4. Run database migrations
make migrate-checklist
make migrate-supplier
```

APIs will be available at:
- Supplier service: `http://localhost:3001`
- Checklist service: `http://localhost:3000`
- RabbitMQ UI: `http://localhost:15672` (guest/guest)

### With Makefile

```bash
make up                   # start all containers
make migrate-checklist    # run Prisma migrations for checklist-service
make migrate-supplier     # run Prisma migrations for supplier-service
make test                 # run tests for both services
make logs                 # follow logs from all services
make down                 # stop all containers
```

---

## supplier-service API

All endpoints are prefixed with `/suppliers`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/suppliers` | Register a new supplier |
| `GET` | `/suppliers` | List all suppliers |
| `GET` | `/suppliers/:id` | Get a supplier by id |
| `PATCH` | `/suppliers/:id/approve` | Approve a supplier |
| `PATCH` | `/suppliers/:id/reject` | Reject a supplier |

### `POST /suppliers`

```json
// Request
{
  "companyName": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1-555-0100",
  "country": "US"
}

// Response 201
{
  "id": "3f4a8b2c-...",
  "companyName": "Acme Corp",
  "email": "contact@acme.com",
  "status": "PENDING",
  "createdAt": "2025-04-25T10:00:00.000Z"
}
```

### Domain Events published

| Event | Trigger |
|---|---|
| `supplier.registered` | `POST /suppliers` |
| `supplier.approved` | `PATCH /suppliers/:id/approve` |
| `supplier.rejected` | `PATCH /suppliers/:id/reject` |

---

## checklist-service API

All endpoints are prefixed with `/checklists`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/checklists` | Create a new checklist |
| `GET` | `/checklists/:id/progress` | Get completion progress |
| `PATCH` | `/checklists/:id/tasks/:taskId/complete` | Complete a task |

---

## Tech Stack

| Category | Technology |
|---|---|
| **Runtime** | Node.js 20, TypeScript 5 |
| **HTTP** | Express 4, Zod (validation) |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` |
| **Messaging** | RabbitMQ 3 (amqplib) |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Testing** | Vitest, @vitest/coverage-v8 |
| **Containers** | Docker, docker-compose |
| **CI/CD** | GitHub Actions |

---

## License

MIT © 2025 [andresjose423](https://github.com/andresjose423)
