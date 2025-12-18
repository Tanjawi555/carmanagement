# Car Rental Management System

## Overview
A multilingual (Arabic, English, French) car rental management web application with admin-only access. The system manages cars, clients, rentals, expenses, and profit tracking.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: MongoDB (mongodb://127.0.0.1:27017/carrental)
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Bootstrap 5 with RTL support

## Features
- **Multilingual**: Arabic (default), English, French with language switcher
- **Cars**: Add, manage status (Available/Rented/Reserved)
- **Clients**: Add with document uploads (passport/ID, driving license)
- **Rentals**: Assign cars to clients with automatic status updates
- **Expenses**: Track by category (maintenance, insurance, fuel, other)
- **Profits**: Auto-calculate revenue minus expenses
- **Dashboard**: Real-time stats and notifications

## Default Admin Users
- Username: `admin` / Password: `admin1234`
- Username: `manager` / Password: `manager1234`

## Running the App
```bash
npm run dev
```
The app runs on port 5000.

## File Structure
```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth.js authentication
│   │   │   ├── cars/          # Cars CRUD API
│   │   │   ├── clients/       # Clients CRUD API
│   │   │   ├── rentals/       # Rentals CRUD API
│   │   │   ├── expenses/      # Expenses CRUD API
│   │   │   ├── dashboard/     # Dashboard data API
│   │   │   ├── profits/       # Profits data API
│   │   │   ├── upload/        # File upload API
│   │   │   └── init/          # Database initialization
│   │   ├── login/             # Login page
│   │   ├── cars/              # Cars management page
│   │   ├── clients/           # Clients management page
│   │   ├── rentals/           # Rentals management page
│   │   ├── expenses/          # Expenses management page
│   │   ├── profits/           # Profits overview page
│   │   ├── page.tsx           # Dashboard (home) page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── Navbar.tsx         # Navigation bar
│   │   └── AuthProvider.tsx   # Authentication wrapper
│   └── lib/                   # Utility libraries
│       ├── mongodb.ts         # MongoDB connection
│       ├── auth.ts            # NextAuth configuration
│       ├── models.ts          # Database models
│       └── translations.ts    # i18n translations
├── public/
│   └── uploads/documents/     # Client document uploads
├── next.config.ts             # Next.js configuration
├── package.json               # Project dependencies
└── tsconfig.json              # TypeScript configuration
```

## Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: NextAuth.js secret key
- `NEXTAUTH_URL`: Base URL for authentication

## Security
- Password hashing with bcryptjs
- JWT-based session management
- Login required for all pages (except login)
- File upload validation (images only, max 5MB)

## Recent Changes (December 2024)
- Migrated from Python/Flask to Next.js 15 with App Router
- Changed database from SQLite to MongoDB
- Added NextAuth.js for authentication
- Converted all templates to React components with TypeScript
