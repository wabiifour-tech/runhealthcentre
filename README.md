# RUHC - Redeemer's University Health Centre Management System

A comprehensive Hospital Management System built for Redeemer's University Health Centre, Nigeria. This system manages patient records, appointments, pharmacy, laboratory services, and healthcare operations.

## Features

### Core Modules
- **Patient Management** - Registration, records, medical history
- **Appointments** - Scheduling, queue management
- **Pharmacy** - Drug inventory, prescriptions, dispensing
- **Laboratory** - Test requests, results management
- **Nursing Station** - Vitals, nursing notes, patient care
- **Doctor's Portal** - Consultations, diagnoses, prescriptions

### Additional Features
- **Blood Bank** - Donor registration, blood inventory
- **Immunization** - Vaccination records and scheduling
- **Insurance Claims** - NHIS and private insurance management
- **Surgery Bookings** - Theatre scheduling and management
- **Patient Wallet** - Billing and payment tracking

## Technology Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Custom role-based auth with 2FA support
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env` file with:
```
DATABASE_URL="your-postgresql-connection-string"
```

## User Roles

| Role | Access Level |
|------|-------------|
| SUPER_ADMIN | Full system access |
| DOCTOR | Patient care, consultations, prescriptions |
| NURSE | Vitals, nursing notes, patient care |
| PHARMACIST | Drug dispensing, inventory |
| LAB_TECHNICIAN | Lab tests, results |
| RECORD_OFFICER | Patient registration, records |
| ACCOUNTANT | Billing, payments |
| STUDENT | Limited patient portal access |

## Default Login

**SuperAdmin Credentials:**
- Email: `wabithetechnurse@ruhc`
- Password: `#Abolaji7977`

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── hms/           # Main HMS application
│   └── globals.css    # Global styles
├── components/
│   ├── ui/            # Reusable UI components
│   ├── charts/        # Dashboard charts
│   └── patient/       # Patient-specific components
├── lib/               # Utility functions and helpers
├── hooks/             # Custom React hooks
└── generated/         # Prisma generated files
```

## License

This project is proprietary software for Redeemer's University Health Centre.

## Author

**Abolaji Odewabi**
Redeemer's University Health Centre
Nigeria

---

© 2026 Redeemer's University Health Centre. All rights reserved.
