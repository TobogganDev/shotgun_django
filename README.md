# Shotgun Django

A ticketing platform with a Django REST API backend and a React/Vite frontend.

---

## Prerequisites

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
