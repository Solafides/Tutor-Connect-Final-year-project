# 🚀 Quick Start Guide

## Step 1: Project Setup Complete ✅

The following has been set up for you:

### ✅ Completed
- Next.js 15.5.10 with TypeScript 5.7 and App Router (with Turbopack)
- Comprehensive Prisma schema (20+ models) - Prisma 6.2
- Tailwind CSS 3.4 with your existing green/white design
- Project structure and configuration files
- Utility functions and validation schemas
- Type definitions
- Latest stable versions of all dependencies

### 🗂️ Old Files Preserved
Your original Vite app UI files have been moved to `/old-vite-app/` for reference.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Local PostgreSQL Database

### Option A: Using Docker (Recommended)

```bash
docker run --name tutorconnect-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=tutorconnect -p 5432:5432 -d postgres:14
```

### Option B: Install PostgreSQL Locally
1. Download from: https://www.postgresql.org/download/
2. Install and create a database named `tutorconnect`
3. Update `.env` with your credentials

## Step 4: Push Database Schema

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push
```

## Step 5: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Next Steps

### Phase 2: Authentication Setup (Next.js Auth v5)
- Configure NextAuth.js
- Create login/register pages
- Set up middleware for RBAC

### Phase 3: Build Core Features
- Landing page (migrated from old UI)
- Student dashboard
- Tutor profile & verification
- Search functionality
- Wallet & escrow system

## Helpful Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Create a migration (for production)
npm run db:migrate

# Run linting
npm run lint

# Build for production
npm run build
```

## Database Schema Highlights

### User Roles
- `STUDENT` - Search and book tutors
- `TUTOR` - Offer tutoring services
- `STAFF` - Verify tutors
- `ADMIN` - System administration

### Key Features Implemented
✅ Role-based authentication with 4 user types
✅ Tutor verification with document uploads
✅ Wallet with escrow payment system
✅ Booking workflow with status tracking
✅ Virtual classroom integration
✅ Rating & review system
✅ Complaint handling
✅ Availability scheduling

### Escrow Payment Flow
1. Student deposits → Wallet
2. Booking created → Funds HELD
3. Session completed → Funds RELEASED to tutor (minus 10% fee)
4. Tutor withdraws earnings

## Project Structure

```
src/
├── app/                    # Next.js pages (App Router)
│   ├── layout.tsx         # Root layout with fonts
│   ├── page.tsx           # Homepage (redirects to /landing)
│   └── globals.css        # Tailwind + custom styles
├── lib/                    # Utilities
│   ├── db.ts              # Prisma client
│   ├── utils.ts           # Helper functions
│   └── validations.ts     # Zod schemas
└── types/
    └── index.ts           # TypeScript types
```

## Deployment (When Ready)

### To Vercel:
1. Push to GitHub
2. Import to Vercel
3. Add Vercel Postgres
4. Deploy!

See full instructions in README.md

---

**Ready to build!** 🎉
