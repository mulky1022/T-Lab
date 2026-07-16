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

Administrator 1:
  Name: Nimal Perera
  Email: admin1@tlab.com
  Password: Admin@123
  Role: Administrator

Administrator 2:
  Name: Kasun Fernando
  Email: admin2@tlab.com
  Password: Admin@123
  Role: Administrator

Project Manager:
  Name: Chamith Jayasinghe
  Email: manager@tlab.com
  Password: Manager@123
  Role: Project Manager

Team Member:
  Name: Sahan Wickramasinghe
  Email: member@tlab.com
  Password: Member@123
  Role: Team Member


  Technology	Version	Purpose
Next.js	14.2.15	React framework (Pages Router)
React	18.3.1	UI library
TypeScript	5.5.4	Type safety
Tailwind CSS	3.4.17	Utility-first styling
Framer Motion	11.5.4	Animations
Lucide React	0.522.0	Icons
Recharts	2.12.7	Charts/data visualization
Sonner	2.0.1	Toast notifications
PostCSS + Autoprefixer	—	CSS processing
Google Fonts	—	Space Grotesk + Inter
Backend
Technology	Version	Purpose
Laravel	13.8	PHP web framework
PHP	8.3+	Server-side language
Vite	8.0.0	Asset bundling
Tailwind CSS	4.0.0	Backend styling
JWT Auth	tymon/jwt-auth	Token authentication
Laravel Permission	spatie/laravel-permission	RBAC
Resend PHP SDK	1.5+	Transactional email
GuzzleHTTP	—	HTTP client
PHPUnit	12.5.12	Testing
Mockery	1.6	Test mocking
Laravel Pint	1.27	Code style fixer
Concurrently	9.0.1	Run multiple dev commands
Database
Technology	Purpose
PostgreSQL	Primary database
Redis	Cache/queue driver
Laravel Eloquent	ORM
Laravel Migrations	Schema versioning
DevOps & Tools
Technology	Purpose
Git	Version control
Windows/PowerShell	Dev environment
AWS S3	File storage (configured)
Security
JWT stateless API auth
Bcrypt password hashing (12 rounds)
OTP email verification (6-digit, 5-min expiry)
CSRF protection, rate limiting, CORS
This is a full-stack Laravel + Next.js application with PostgreSQL, JWT auth, and Tailwind CSS throughout.


cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

cd ../frontend
npm install
npm run dev