# RUHC Hospital Management System
## Technical Documentation & Showcase Guide

**Developer:** Abolaji Odewabi  
**Facility:** Redeemer's University Health Centre (RUHC)  
**Version:** 2.5.1  
**Date:** March 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technical Stack](#technical-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Features by Role](#features-by-role)
8. [Running Locally](#running-locally)
9. [Deployment](#deployment)
10. [Transfer to ICT](#transfer-to-ict)
11. [Support & Maintenance](#support--maintenance)

---

## System Overview

RUHC HMS is a comprehensive Hospital Management System designed for Redeemer's University Health Centre. It provides end-to-end management of:

- Patient Registration & Records
- Consultations & Diagnoses
- Laboratory Services
- Pharmacy Management
- Appointments & Scheduling
- Ward Management & Admissions
- Staff Attendance & Scheduling
- Blood Bank Management
- Insurance & NHIA Claims
- Surgery Bookings
- Emergency Services
- Real-time Notifications
- Voice Notes & Communication

---

## Technical Stack

### Frontend
- **Framework:** Next.js 16.1.3 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x
- **UI Components:** shadcn/ui (Radix-based)
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma 7.x
- **Authentication:** JWT + bcryptjs
- **Real-time:** Server-Sent Events (SSE)

### Infrastructure
- **Hosting:** Vercel (Serverless Functions)
- **Database:** Neon PostgreSQL (Serverless)
- **Version Control:** GitHub

### Key Dependencies
```json
{
  "next": "16.1.3",
  "react": "^19.0.0",
  "typescript": "^5",
  "prisma": "^6.1.0",
  "@prisma/client": "^6.1.0",
  "@neondatabase/serverless": "^0.10.0",
  "@prisma/adapter-neon": "^5.21.0",
  "bcryptjs": "^2.4.3",
  "tailwindcss": "^4",
  "recharts": "^2.12.7",
  "lucide-react": "^0.454.0"
}
```

---

## Architecture

### Project Structure
```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/               # Authentication
│   │   │   ├── login/route.ts
│   │   │   └── signup/route.ts
│   │   ├── patients/route.ts   # Patient CRUD
│   │   ├── consultations/route.ts
│   │   ├── lab-requests/route.ts
│   │   ├── drugs/route.ts
│   │   ├── appointments/route.ts
│   │   ├── notifications/route.ts
│   │   ├── routing/route.ts    # Cross-department routing
│   │   ├── insurance-claims/route.ts
│   │   ├── surgery-bookings/route.ts
│   │   ├── blood-bank/route.ts
│   │   ├── immunization/route.ts
│   │   ├── medication-admin/route.ts
│   │   ├── patient-tasks/route.ts
│   │   └── wallet/route.ts
│   ├── hms/
│   │   └── page.tsx            # Main Application (Single Page App)
│   ├── layout.tsx
│   └── page.tsx                # Landing Page
├── components/
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── db.ts                   # Database client
│   ├── errors.ts               # Error handling
│   ├── logger.ts               # Logging utility
│   ├── auth.ts                 # Password utilities
│   ├── session.ts              # Session management
│   └── utils.ts                # Helper functions
├── generated/
│   └── prisma/                 # Generated Prisma client
└── hooks/
    ├── use-mobile.ts
    └── use-toast.ts
```

### Database Connection Flow
```
1. Next.js API Route receives request
2. getPrisma() creates Neon adapter
3. PrismaClient connects via connection pooling
4. Query executes with $queryRawUnsafe or typed queries
5. Response returns JSON
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL,  -- SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN, MATRON, RECORDS_OFFICER
  department TEXT,
  initials TEXT,
  phone TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  approvalStatus TEXT DEFAULT 'PENDING',
  approvedBy TEXT,
  approvedAt TIMESTAMP,
  rememberToken TEXT,
  tokenExpiresAt TIMESTAMP,
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### patients
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  hospitalNumber TEXT,
  ruhcCode TEXT UNIQUE NOT NULL,
  matricNumber TEXT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  gender TEXT,
  dateOfBirth TEXT,
  bloodGroup TEXT,
  genotype TEXT,
  phone TEXT,
  email TEXT,
  allergies TEXT,
  chronicConditions TEXT,
  currentUnit TEXT,
  bedNumber INTEGER,
  admissionDate TIMESTAMP,
  dischargeDate TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,
  registeredAt TIMESTAMP DEFAULT NOW()
);
```

#### consultations
```sql
CREATE TABLE consultations (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  patient JSONB,
  doctorId TEXT,
  doctorName TEXT,
  status TEXT DEFAULT 'pending',
  chiefComplaint TEXT,
  historyOfPresentIllness TEXT,
  bloodPressureSystolic TEXT,
  bloodPressureDiastolic TEXT,
  temperature TEXT,
  pulse TEXT,
  respiratoryRate TEXT,
  weight TEXT,
  height TEXT,
  oxygenSaturation TEXT,
  generalExamination TEXT,
  systemExamination TEXT,
  provisionalDiagnosis TEXT,
  finalDiagnosis TEXT,
  treatmentPlan TEXT,
  prescriptions JSONB,
  referredTo TEXT,
  sentAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### routing_requests
```sql
CREATE TABLE routing_requests (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  receiver_id TEXT,
  receiver_name TEXT,
  receiver_role TEXT,
  patient_id TEXT,
  patient_name TEXT,
  request_type TEXT NOT NULL,
  priority TEXT DEFAULT 'routine',
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Full Schema Location
See: `/prisma/schema.prisma`

---

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login with Remember Me |
| `/api/auth/login` | GET | Validate Remember Me token |
| `/api/auth/login` | DELETE | Logout (clear token) |
| `/api/auth/signup` | POST | Multi-step registration |
| `/api/user-approval` | GET | Get pending users |
| `/api/user-approval` | PUT | Approve/reject user |

### Patients
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients` | GET | List all patients |
| `/api/patients` | POST | Register new patient |
| `/api/patients` | PUT | Update patient |
| `/api/patients` | DELETE | Delete patient |

### Clinical
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/consultations` | GET/POST/PUT | Consultations |
| `/api/lab-requests` | GET/POST/PUT | Lab requests |
| `/api/lab-results` | GET/POST | Lab results |
| `/api/prescriptions` | GET/POST/PUT | Prescriptions |
| `/api/vitals` | GET/POST | Vital signs |
| `/api/diagnoses` | GET/POST | Diagnosis records |

### Routing & Communication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/routing` | GET/POST/PUT | Cross-department routing |
| `/api/notifications` | GET/POST/PUT | Role-based notifications |
| `/api/realtime` | GET | SSE real-time updates |

### Pharmacy
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/drugs` | GET/POST/PUT | Drug inventory |
| `/api/dispensed-drugs` | GET/POST | Dispensing records |
| `/api/medication-admin` | GET/POST | Medication administration |

### Specialized Services
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insurance-claims` | GET/POST/PUT | Insurance claims |
| `/api/surgery-bookings` | GET/POST/PUT | Surgery scheduling |
| `/api/blood-bank` | GET/POST/PUT | Blood bank management |
| `/api/immunization` | GET/POST | Immunization records |
| `/api/patient-tasks` | GET/POST/PUT | Nursing tasks |
| `/api/wallet` | GET/POST | Patient payment wallets |

### Administrative
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/announcements` | GET/POST | Announcements |
| `/api/attendance` | GET/POST | Staff attendance |
| `/api/rosters` | GET/POST | Duty rosters |
| `/api/audit` | GET/POST | Audit logs |
| `/api/settings` | GET/PUT | App settings |
| `/api/admin/sync-schema` | POST | Sync database schema |

---

## User Roles & Permissions

### Role Hierarchy
```
SUPER_ADMIN > ADMIN > DOCTOR > NURSE/MATRON > PHARMACIST > LAB_TECHNICIAN > RECORDS_OFFICER
```

### Permissions Matrix

| Feature | SUPER_ADMIN | ADMIN | DOCTOR | NURSE | PHARMACIST | LAB_TECH | MATRON | RECORDS |
|---------|-------------|-------|--------|-------|------------|----------|--------|---------|
| User Management | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Patient Registration | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Patient Records | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Consultations | ✓ | ✓ | ✓ | View | View | View | View | View |
| Prescribe | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Dispense Drugs | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Lab Requests | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Lab Results | ✓ | ✓ | View | View | View | ✓ | View | View |
| Admit Patients | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Discharge Patients | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Surgery Booking | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Insurance Claims | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Blood Bank | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Staff Attendance | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Audit Logs | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| App Settings | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## Features by Role

### SUPER_ADMIN
- Full system access
- User management (add, approve, deactivate)
- System settings & configuration
- Audit log access
- All clinical functions

### ADMIN
- User approval
- Dashboard analytics
- All clinical functions
- Staff management
- Announcements

### DOCTOR
- Patient consultations
- Diagnoses & prescriptions
- Lab requests & review
- Surgery bookings
- Insurance claims
- Medical certificates

### NURSE
- Patient registration
- Vital signs recording
- Medication administration
- Patient tasks/interventions
- Send to doctor
- Blood bank donor registration

### PHARMACIST
- Drug inventory management
- Prescription dispensing
- Expiry tracking
- Low stock alerts

### LAB_TECHNICIAN
- Process lab requests
- Enter lab results
- Lab test management

### MATRON
- Ward management
- Patient admissions
- Staff supervision
- Discharge summaries
- Immunization records

### RECORDS_OFFICER
- Patient registration
- Medical records management
- Document printing
- Archive management

---

## Running Locally

### Prerequisites
- Node.js 18+
- npm or bun
- PostgreSQL database (or Neon account)

### Steps

```bash
# 1. Clone repository
git clone https://github.com/wabiifour-tech/runhealthcentre.git
cd runhealthcentre

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env file with:
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
DIRECT_DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# 4. Generate Prisma client
npx prisma generate

# 5. Run development server
npm run dev

# 6. Open in browser
# http://localhost:3000
```

### Default SuperAdmin Credentials
```
Email: wabithetechnurse@ruhc
Password: #Abolaji7977
```

---

## Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Your commit message"
git push origin main

# 2. Connect to Vercel
# - Go to vercel.com
# - Import project from GitHub
# - Set environment variables
# - Deploy

# 3. Auto-deploy
# Every push to 'main' triggers automatic deployment
```

### Environment Variables Required
```
DATABASE_URL=your_neon_postgresql_url
DIRECT_DATABASE_URL=your_neon_postgresql_url
```

### Production URL
```
https://runhealthcentre.vercel.app
```

---

## Transfer to ICT

### Option 1: GitHub Transfer

```bash
# 1. Add ICT as collaborator on GitHub
# Go to: https://github.com/wabiifour-tech/runhealthcentre/settings/access
# Click: "Add people"
# Enter: ICT's GitHub username or email

# 2. Transfer ownership (optional)
# Go to: https://github.com/wabiifour-tech/runhealthcentre/settings/transfer
# Enter: ICT's GitHub username
```

### Option 2: Complete Handoff Package

Create a ZIP file containing:

```
runhealthcentre/
├── src/                    # Source code
├── prisma/                 # Database schema
├── public/                 # Static assets
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Styling config
├── next.config.ts          # Next.js config
├── .env.example            # Environment template
├── README.md               # Documentation
└── TECHNICAL_DOCS.md       # This file
```

### Option 3: Repository Clone

```bash
# ICT can clone the repository:
git clone https://github.com/wabiifour-tech/runhealthcentre.git

# Or create their own copy:
gh repo create rruhc-hms --public --clone
cd rruhc-hms
git pull https://github.com/wabiifour-tech/runhealthcentre.git main
```

### Required Handoff Information

1. **Database Credentials**
   - Neon account email
   - Database connection string
   - Or: Export SQL dump

2. **Hosting**
   - Vercel project ownership transfer
   - Or: New Vercel deployment

3. **GitHub Access**
   - Repository access or transfer

4. **Documentation**
   - This technical documentation
   - README.md
   - API documentation

---

## Support & Maintenance

### Common Issues

#### Database Connection Error
```bash
# Check DATABASE_URL format
# Should be: postgresql://user:pass@host/db?sslmode=require

# Regenerate Prisma client
npx prisma generate
```

#### Build Fails on Vercel
```bash
# Check Node.js version in package.json
"engines": { "node": ">=18" }

# Clear Vercel cache and redeploy
```

#### Login Not Working
```bash
# Run schema sync
curl -X POST "https://runhealthcentre.vercel.app/api/admin/sync-schema" \
  -H "Authorization: Bearer ruhc-admin-sync-2026"
```

### Logs & Debugging

- **Vercel Logs:** Dashboard → Project → Logs
- **API Debug:** `/api/debug`
- **Database Status:** `/api/db-status`
- **Health Check:** `/api/health`

### Backup Strategy

```bash
# Export database (Neon dashboard or pg_dump)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20260312.sql
```

---

## Contact

**Developer:** Abolaji Odewabi  
**Email:** wabithetechnurse@ruhc  
**GitHub:** https://github.com/wabiifour-tech/runhealthcentre

---

*Last Updated: March 2026*
