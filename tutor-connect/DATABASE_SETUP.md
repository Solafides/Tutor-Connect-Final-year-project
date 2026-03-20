# Database Setup Guide

## Quick Fix for Current Error

The error `The table 'public.users' does not exist` means the database tables haven't been created yet.

### Steps to Fix:

1. **Stop the dev server** (if running) - Press `Ctrl+C` in the terminal

2. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

3. **Push schema to database (creates all tables):**
   ```bash
   npm run db:push
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Initial Database Setup

### Option 1: Using Docker (Recommended)

```bash
docker run --name tutorconnect-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=tutorconnect -p 5432:5432 -d postgres:16
```

### Option 2: Install PostgreSQL Locally

1. Download from: https://www.postgresql.org/download/
2. Install and create a database named `tutorconnect`

### Configure Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tutorconnect?schema=public"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### Create Database Tables

After setting up PostgreSQL and DATABASE_URL:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or create a migration (for production)
npm run db:migrate
```

### Verify Setup

```bash
# Open Prisma Studio to view your database
npm run db:studio
```

This will open a GUI at http://localhost:5555 where you can see all your tables and data.
