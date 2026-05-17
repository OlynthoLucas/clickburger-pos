# ClickBurger POS

Full-stack Point of Sale system for restaurant management — ASP.NET Core 8 Minimal API + React 19 + MongoDB + SignalR.

Built as a learning project to explore production-grade full-stack development: JWT auth with refresh token rotation, real-time order updates via WebSockets, role-based access control, CI/CD pipeline, and cloud deployment.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | ASP.NET Core 8 Minimal API, MongoDB Driver 3.x, SignalR, FluentValidation, BCrypt, xUnit |
| **Frontend** | React 19, TypeScript, Vite, Zustand, Axios, TailwindCSS v4, Framer Motion |
| **Mobile** | Expo (React Native), Expo Router, TanStack Query |
| **Infrastructure** | MongoDB Atlas, Azure App Service, Vercel, GitHub Actions |

---

## Architecture

```
┌──────────────────┐     HTTPS      ┌─────────────────────┐     ┌──────────────────┐
│   React SPA      │ ─────────────▶ │  ASP.NET Core 8     │────▶│  MongoDB Atlas   │
│   Vercel         │ ◀───────────── │  Azure App Service  │◀────│  Cloud           │
└──────────────────┘                └─────────────────────┘     └──────────────────┘
         │                                    │
         │                          ┌─────────┴─────────┐
         └──────── WebSocket ───────│   SignalR Hub      │
                                    │  /hubs/orders      │
                                    └───────────────────┘
```

**Backend structure — Minimal API with clear separation:**
```
src/ClickBurger/ClickBurger/
├── Endpoints/        # Route handlers grouped by domain (Auth, Orders, Tables, Menu, Cash, Reports)
├── Services/         # Business logic (AuthService, OrderService, CashService, ReportService)
├── Models/           # Domain entities (Order, Table, MenuItem, User, CashSession)
├── DTOs/             # Request / response contracts
├── Authorization/    # JWT policies (SuperAdminOnly, AdminOnly, Staff, AnyUser)
├── Hubs/             # SignalR real-time hub
├── Validation/       # FluentValidation rules per DTO
└── Filters/          # Validation endpoint filter
```

---

## Features

### Authentication & Authorization
- JWT Bearer with **refresh token rotation** (RFC 6749)
- 5 roles: `superadmin`, `admin`, `garcom`, `cozinha`, `user`
- First registered user becomes `superadmin`; staff created by admin via `/api/users/staff`
- Token injected via query string for SignalR connections

### Orders
- Full state machine: `ABERTO → PREPARANDO → PRONTO → FECHADO` (or `CANCELADO`)
- Real-time updates pushed to all clients via SignalR on every status change
- Order items track individual status (`PENDENTE → PREPARANDO → PRONTO → SERVIDO`)

### Tables
- Conflict-safe deletion (blocked while order is active)
- Status derived from active order state

### Cash Sessions
- Open/close cash register with initial value
- Session history for admin reporting

### Reports & Dashboard
- Daily/range sales report with top products
- Dashboard stats: active orders, free tables, total revenue

### Frontend
- Persistent auth state (Zustand + localStorage)
- Automatic token refresh on 401 with request queue (single refresh for concurrent failures)
- Role-based route guards — redirect to role's default page on unauthorized access
- Kitchen display page (real-time order board)
- Payment modal with partial payment support

---

## API Reference

Swagger UI available at `/swagger` in development.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Login, returns JWT + refresh token |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/register` | — | Public registration |
| GET | `/api/menu` | — | Public menu (available items only) |
| GET | `/api/orders` | Staff | List orders (filterable by tableId) |
| POST | `/api/orders` | Staff | Create order |
| PATCH | `/api/orders/{id}` | Staff | Update status / add items |
| GET | `/api/tables` | AnyUser | List tables |
| GET | `/api/reports/sales` | Admin | Sales report |
| GET | `/api/reports/dashboard` | Admin | Dashboard stats |

---

## Running Locally

### Requirements
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- Node.js 20+
- MongoDB (local) or a [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster

### Backend

```bash
cd src/ClickBurger/ClickBurger

# Configure secrets (never committed to git)
dotnet user-secrets set "ConnectionStrings:MongoDb" "<your-mongodb-connection-string>"
dotnet user-secrets set "Jwt:SecretKey" "<min-32-char-secret>"

dotnet run
# API  →  http://localhost:5004
# Swagger  →  http://localhost:5004/swagger
```

### Frontend

```bash
cd src/clickburger-web
cp .env.example .env.local   # set VITE_API_BASE_URL=http://localhost:5004
npm install
npm run dev
# App  →  http://localhost:5173
```

---

## CI/CD

```
push to main
    ├── build-backend   →  dotnet restore → build → test (xUnit, 18 tests)
    ├── build-frontend  →  tsc --noEmit → npm run build
    └── deploy-backend  →  dotnet publish → Azure App Service (on backend file changes)
```

Frontend auto-deploys to Vercel on every push to `main`.

---

## Project Status

This is a portfolio / learning project. The codebase is complete and functional but not actively maintained.

---

## License

[MIT](LICENSE)
