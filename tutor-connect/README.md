# Tutor-Connect Platform

A modern, full-stack tutoring platform connecting students with verified tutors across Ethiopia. Built for Hawassa University Computer Science final-year project.

## 🚀 Features

- **Role-Based Access Control (RBAC)**: Four distinct user roles (Student, Tutor, Staff, Admin)
- **Tutor Verification System**: Multi-step document upload and staff approval workflow
- **Escrow Payment System**: Secure wallet with fund holding until session completion
- **Advanced Search**: Filter tutors by subject, location, price, gender, and tutoring mode
- **Virtual Classroom**: Integrated video sessions with resource sharing
- **Rating & Review System**: Post-session feedback for quality assurance
- **Mobile-Responsive**: Optimized for Ethiopian students in rural and urban areas

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.10 (App Router with Turbopack)
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL with Prisma ORM 6.2
- **Authentication**: NextAuth.js v5.0.0-beta.30
- **Styling**: Tailwind CSS 3.4
- **File Storage**: Vercel Blob
- **Deployment**: Vercel (with Vercel Postgres)

## 📋 Prerequisites

- Node.js 20.9.0 or higher (LTS recommended)
- PostgreSQL 16
- npm or yarn

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd tutor-connect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your local PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tutorconnect?schema=public"
NEXTAUTH_SECRET="generate-using-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Run migrations for production
npm run db:migrate

# (Optional) Seed database with sample data
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

This will start the Next.js development server with Turbopack (faster builds). Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
tutor-connect/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding script
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (public)/         # Public pages (landing, search)
│   │   ├── student/          # Student dashboard & pages
│   │   ├── tutor/            # Tutor dashboard & pages
│   │   ├── staff/            # Staff verification panel
│   │   ├── admin/            # Admin analytics
│   │   └── api/              # API routes
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions & helpers
│   │   ├── db.ts            # Prisma client instance
│   │   ├── auth.ts          # Authentication utilities
│   │   └── validations.ts   # Zod validation schemas
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── package.json
```

## 🔐 User Roles

### Student
- Search and book tutors
- Manage wallet (deposit funds)
- Join virtual classrooms
- Rate and review tutors

### Tutor
- Create profile with verification documents
- Set availability and hourly rates
- Accept/reject booking requests
- Earn and withdraw funds
- Upload classroom resources

### Staff
- Review tutor verification documents
- Approve or reject tutor applications
- Handle complaints
- Release held payments

### Admin
- System oversight
- Manage staff accounts
- View analytics and reports
- Monitor transactions

## 💰 Payment Flow (Escrow System)

1. **Deposit**: Student adds funds to wallet (Mock Chapa integration)
2. **Booking**: Funds deducted and held in escrow
3. **Session**: Virtual classroom access for both parties
4. **Completion**: Tutor marks session complete → Student confirms
5. **Release**: Platform releases payment to tutor (minus 10% platform fee)
6. **Withdrawal**: Tutor withdraws earnings (Mock Telebirr integration)

## 🌍 Ethiopian Localization

- Currency: Ethiopian Birr (ETB)
- Mock integrations for Chapa and Telebirr payment gateways
- i18n support for English and Amharic (upcoming)
- Location filters for Ethiopian cities and areas

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration
5. Add environment variables:
   - `NEXTAUTH_SECRET`: Generate a secure secret
   - `NEXTAUTH_URL`: Your production URL (e.g., `https://tutor-connect.vercel.app`)
   - `PLATFORM_FEE_PERCENTAGE`: `10`
   - `CURRENCY`: `ETB`

### 3. Add Vercel Postgres

1. In your Vercel project dashboard, go to **Storage**
2. Click **Create Database** → **Postgres**
3. Vercel will automatically set `DATABASE_URL` environment variable
4. Run migrations:

```bash
vercel env pull .env.local  # Pull environment variables
npx prisma migrate deploy   # Run migrations in production
```

### 4. (Optional) Add Vercel Blob for File Storage

```bash
vercel blob create tutor-documents
```

This will create `BLOB_READ_WRITE_TOKEN` environment variable automatically.



## 🧪 Testing

```bash
# Run linting
npm run lint

# View database in Prisma Studio
npm run db:studio
```

## 📝 License

This project is part of a university final year project for Hawassa University.

## 👥 Contributors

- [Solomon Timiso, Tebarek Zewude, Fenan Gadissa, Lidiya Simeneh] - Full-Stack Developer
- Hawassa University - Computer Science Department

## 🐛 Known Issues & Roadmap

- [ ] Add Amharic language support
- [ ] Integrate real Chapa API
- [ ] Integrate real Telebirr API
- [ ] Add email notifications
- [ ] Implement real-time chat
- [ ] Add SMS notifications for Ethiopian phone numbers

## 📞 Support

For questions or issues, contact: [soultim57@gmail.com]
