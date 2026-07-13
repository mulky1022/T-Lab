# T-Lab

T-Lab is a full-stack application with a Laravel backend, a Next.js frontend, and a PostgreSQL database.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Laravel, PHP, Composer
- Database: PostgreSQL
- UI libraries: Framer Motion, Lucide React, Recharts
- Testing: PHPUnit

## Project Structure

```text
T-Lab/
├── backend/                 # Laravel backend
│   ├── app/                 # Controllers, models, providers
│   ├── config/              # Laravel configuration
│   ├── database/            # Migrations and seeders
│   ├── public/              # Public entrypoint
│   ├── resources/           # Views, CSS, JS assets
│   ├── routes/              # Backend routes
│   ├── tests/               # Backend tests
│   ├── .env                 # Local backend environment
│   └── .env.example         # Backend env template
├── frontend/                # Next.js frontend
│   ├── public/              # Static assets
│   ├── src/                 # Pages, components, context, etc.
│   ├── package.json         # Frontend dependencies
│   └── .env.example         # Frontend env template
├── run-dev.bat              # Quick start script for Windows
└── README.md                # Project instructions
```

## Prerequisites

Install these before starting the app:

- PHP 8.3+
- Composer
- Node.js 18+
- npm
- PostgreSQL server
- PHP PostgreSQL extension enabled (pdo_pgsql and pgsql)

## PostgreSQL Setup

Create a PostgreSQL database named `t_lab` and make sure your PostgreSQL user is available.

Use these values in the backend environment file:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=t_lab
DB_USERNAME=postgres
DB_PASSWORD=2001
```

## Quick Start on Windows

### Option 1: Use the batch file

From the project root, run:

```bat
run-dev.bat
```

This opens two terminals:
- Laravel backend at http://127.0.0.1:8000
- Next.js frontend at http://localhost:3000

### Option 2: Start manually

Backend:

```bat
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Frontend:

```bat
cd frontend
npm install
npm run dev
```

## Backend Commands

```bat
cd backend
php artisan migrate
php artisan test
php artisan serve
```

## Frontend Commands

```bat
cd frontend
npm install
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- The frontend and backend are started separately.
- The backend uses PostgreSQL, not MySQL.
- Keep the existing UI and application features unchanged while developing.
