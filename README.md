# Shotgun Django

A ticketing platform with a Django REST API backend and a React/Vite frontend.

---

## 🐳 Quick start with Docker (recommended)

The whole stack (PostgreSQL + Django/Gunicorn + React served by Nginx) runs with
a single command. You only need **Docker** and **Docker Compose**.

```bash
# 1. Copy the env
cp .env.example .env

# 2. Build and start everything
docker compose up --build
```

Then open **http://localhost:8080**.

| URL | Service |
|-----|---------|
| http://localhost:8080 | React frontend (Nginx) |
| http://localhost:8080/api/ | Django REST API (proxied) |
| http://localhost:8080/admin/ | Django admin (proxied) |
| http://localhost:8080/api/docs/ | Swagger UI |
| http://localhost:8080/api/redoc/ | ReDoc |
| http://localhost:8080/api/schema/ | OpenAPI schema (JSON/YAML) |

### Architecture

```
                 ┌──────────────────────────────────────────┐
  Browser  ─────▶│  frontend (Nginx :80 → host :8080)         │
                 │   • serves the built React SPA             │
                 │   • /api, /admin, /static → proxy backend  │
                 │   • /media → shared volume                 │
                 └───────────────┬────────────────────────────┘
                                 │ (internal network)
                 ┌───────────────▼────────────────────────────┐
                 │  backend (Django + Gunicorn :8000)          │
                 │   • migrate + collectstatic on startup      │
                 │   • WhiteNoise for /static                  │
                 └───────────────┬────────────────────────────┘
                                 │
                 ┌───────────────▼────────────────────────────┐
                 │  db (PostgreSQL 16, persistent volume)      │
                 └─────────────────────────────────────────────┘
```

### Useful commands

```bash
docker compose up -d --build          # run detached
docker compose logs -f backend        # follow backend logs
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py seed --flush
docker compose down                   # stop (keeps data volumes)
docker compose down -v                # stop and wipe the database/media volumes
```

Data persists across restarts in the `postgres_data`, `media_volume`, and
`static_volume` Docker volumes.

---

## 🗺️ API URLs & data models

How requests flow from `config/urls.py` through each app's views down to the
models, with the relationships between them.

```mermaid
flowchart TB
    ROOT["config/urls.py<br/><i>API REST — entry point</i>"]:::entry

    subgraph ACCOUNTS["🔑 accounts — Auth & Profiles"]
      direction TB
      A_URL["api/auth/<br/>register · login · refresh · me"]:::url
      A_URL --> REGV["RegisterView"]:::view
      A_URL --> JWTV["Token Obtain / Refresh<br/>(login JWT)"]:::view
      A_URL --> MEV["MeView"]:::view
      PROFILE["Profile<br/><i>role: organizer / attendee</i>"]:::model
    end

    subgraph EVENTS["🎫 events — Events"]
      direction TB
      E_URL["api/events/<br/>list · create · detail · update"]:::url
      E_URL --> EVS["EventViewSet<br/>+ @action register"]:::view
      EVENT["Event"]:::model
    end

    subgraph TICKETS["🎟️ tickets — Tickets"]
      direction TB
      T_URL["api/tickets/mine/<br/>api/tickets/{code}/qr/"]:::url
      T_URL --> MTV["MyTicketsView"]:::view
      T_URL --> QRV["TicketQRView"]:::view
      REGM["Registration<br/><i>ticket_code (UUID)</i>"]:::model
    end

    ROOT --> A_URL
    ROOT --> E_URL
    ROOT --> T_URL

    REGV --> PROFILE
    MEV --> USER
    EVS --> EVENT
    MTV --> REGM
    QRV --> REGM
    EVS -. "register" .-> REGM

    USER[("auth.User")]:::user
    PROFILE -- "1–1" --> USER
    EVENT -- "organizer" --> USER
    REGM -- "user" --> USER
    REGM -- "event" --> EVENT

    classDef entry fill:#1f2937,stroke:#111,color:#fff,font-weight:bold;
    classDef url fill:#eef2ff,stroke:#4f46e5,color:#1e1b4b;
    classDef view fill:#ffffff,stroke:#64748b,color:#0f172a;
    classDef model fill:#f5f0ff,stroke:#7c3aed,color:#2e1065,font-weight:bold;
    classDef user fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:bold;

    style ACCOUNTS fill:#fafaff,stroke:#c7d2fe,color:#000;
    style EVENTS fill:#fafaff,stroke:#c7d2fe,color:#000;
    style TICKETS fill:#fafaff,stroke:#c7d2fe,color:#000;
```

> **Legend** — blue = URLs · white = DRF views · purple = models · amber = Django `User`.
> Solid arrow = ORM / relation · dotted arrow = custom action.

---

## 📖 API Documentation

Interactive docs are served automatically by the backend:

| URL | Description |
|-----|-------------|
| `/api/docs/` | Swagger UI — browse and test endpoints interactively |
| `/api/redoc/` | ReDoc — clean, readable reference |
| `/api/schema/` | Raw OpenAPI 3 schema (JSON by default, append `?format=yaml` for YAML) |

When running locally the Swagger UI is at **http://localhost:8000/api/docs/**.

---

## Prerequisites (local, without Docker)

- Python 3.10+
- Node.js 18+
- npm

---

## Backend (Django)

```bash
# From the project root
cd backend

# Create and activate a virtual environment
python3 -m venv ../venv
MacOS :
source ../venv/bin/activate
Windows : 
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; ..\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Start the development server (runs on http://localhost:8000)
python manage.py runserver
```

To create a superuser for the Django admin:

```bash
python manage.py createsuperuser
```

---

## Seeding mock data

To populate the database with demo users, events, and registrations:

```bash
# Add demo data
python manage.py seed

# Wipe previously seeded data, then re-seed
python manage.py seed --flush
```

This creates:

- **2 organizers** and **5 attendees** (with the correct roles)
- **6 events** with varied prices, venues, dates, and **cover images** (including one past event)
- **~19 registrations** with mixed statuses (`confirmed`, `pending`, `cancelled`)

All seeded users share the same password: **`password123`**

The command is idempotent (running it again won't create duplicates), and `--flush` only removes the seeded demo data — your superuser is left untouched.

The demo cover images are committed in `backend/events/seed_images/` and copied into
`backend/media/events/` automatically when you run the command, so they display out of
the box. Real user uploads under `media/` stay out of version control.

---

## Frontend (React + Vite)

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start the development server (runs on http://localhost:5173)
npm run dev
```

---

## Running both servers

Open two terminal tabs and run each server in parallel:

| Tab | Command |
|-----|---------|
| 1 (backend) | `cd backend && source ../venv/bin/activate && python manage.py runserver` |
| 2 (frontend) | `cd frontend && npm run dev` |

The frontend proxies API requests to the Django backend automatically.
