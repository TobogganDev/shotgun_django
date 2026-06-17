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
source ../venv/bin/activate

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
