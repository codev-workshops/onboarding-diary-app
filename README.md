# Onboarding Diary App

A web application for new recruits to document their onboarding journey. Users log daily tasks, record issues, provide feedback, and capture notes. Managers can view entries and generate downloadable reports.

## Tech Stack

### Backend
- **Python 3.11** with **FastAPI**
- **SQLAlchemy 2.0** (async) with **Alembic** migrations
- **PostgreSQL 16** database
- **JWT** authentication (python-jose + passlib)
- **ReportLab** for PDF generation
- **pytest** + **pytest-asyncio** for testing
- **ruff** for linting and formatting

### Frontend
- **React 19** with **TypeScript**
- **Vite** build tool
- **Ant Design 6** component library
- **React Router 7** for navigation
- **Axios** for API calls
- **Recharts** for data visualization
- **ESLint** + **Prettier** for linting and formatting

### Infrastructure
- **Docker Compose** with 3 services (frontend, backend, db)
- **nginx** reverse proxy for frontend

## Features

- **Authentication** — Register, login, JWT-based session management
- **Task Log** — Create, edit, delete tasks with category, status, priority filters
- **Issue Log** — Track blockers with severity levels and resolution notes
- **Feedback** — Submit positive feedback, suggestions, or concerns
- **Notes** — Free-form notes with tags
- **Dashboard** — Summary statistics, completion rates, recent entries
- **Reports** — Generate CSV/PDF reports by date range; managers can report on recruits
- **Role-Based Access** — Recruit (own data), Manager (assigned recruits), Admin (all data)

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/codev-workshops/onboarding-diary-app.git
   cd onboarding-diary-app
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Start all services:
   ```bash
   docker-compose up --build
   ```

4. Run database migrations:
   ```bash
   docker compose exec backend alembic upgrade head
   ```

5. Access the application:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation (Swagger)**: http://localhost:8000/docs
   - **API Documentation (ReDoc)**: http://localhost:8000/redoc

## User Roles

| Role    | Permissions                                      |
|---------|--------------------------------------------------|
| Recruit | Create/edit/delete own tasks, issues, feedback, notes |
| Manager | View assigned recruits' entries, generate reports |
| Admin   | View all data, manage users                      |

## API Documentation

Once the backend is running, interactive API docs are available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/v1/auth/register`     | Register a new user      |
| POST   | `/api/v1/auth/login`        | Login and get JWT token  |
| GET    | `/api/v1/auth/me`           | Get current user profile |
| CRUD   | `/api/v1/tasks`             | Task management          |
| CRUD   | `/api/v1/issues`            | Issue management         |
| CRUD   | `/api/v1/feedback`          | Feedback management      |
| CRUD   | `/api/v1/notes`             | Notes management         |
| GET    | `/api/v1/dashboard`         | Dashboard summary        |
| POST   | `/api/v1/reports/generate`  | Generate CSV/PDF report  |

## Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run tests
pytest

# Lint and format
ruff check .
ruff format .
```

### Frontend

```bash
cd frontend
npm install

# Dev server
npm run dev

# Build
npm run build

# Lint
npx eslint src/
npx prettier --check src/
```

## Project Structure

```
onboarding-diary-app/
├── backend/
│   ├── app/
│   │   ├── auth/          # Authentication & authorization
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API route handlers
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── config.py      # App configuration
│   │   ├── database.py    # Database setup
│   │   └── main.py        # FastAPI app entry point
│   ├── alembic/           # Database migrations
│   ├── tests/             # pytest test suite
│   ├── pyproject.toml     # Ruff & pytest config
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # API client modules
│   │   ├── context/       # React context (auth)
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # App layout & routing
│   ├── .prettierrc        # Prettier config
│   └── package.json
├── db/init/               # Database init scripts
├── docker-compose.yml
├── .env.example
└── docs/
    └── DEVELOPMENT_SPEC.md
```

## Screenshots

*Screenshots section — add screenshots of the running application here.*

## License

This project is for internal use.
