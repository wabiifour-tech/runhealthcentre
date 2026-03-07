# TeleHealth Nigeria

Quality Healthcare, Anytime, Anywhere - A video consultation platform connecting Nigerians with licensed doctors.

## Features

- 🔐 **Secure Authentication** - Patient and Doctor registration with role-based access
- 📹 **Video Consultations** - High-quality video calls between doctors and patients
- 💊 **Digital Prescriptions** - Doctors can create and send prescriptions digitally
- 💳 **Paystack Integration** - Secure payments with cards, bank transfer, USSD
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🔔 **Real-time Notifications** - Stay updated on appointments and prescriptions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: Custom session-based auth with bcrypt
- **Payments**: Paystack Integration
- **Video**: WebRTC-based video consultations

## Getting Started

### Prerequisites

- Node.js 18+
- Bun or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/wabiifour-tech/telehealth-nigeria.git
cd telehealth-nigeria
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
DATABASE_URL="file:./db/telehealth.db"
PAYSTACK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Generate Prisma client and push database:
```bash
bun run db:generate
bun run db:push
```

5. Run the development server:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
telehealth-nigeria/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── appointments/ # Appointment management
│   │   │   ├── prescriptions/# Prescription CRUD
│   │   │   ├── payments/     # Paystack integration
│   │   │   └── doctors/      # Doctor listings
│   │   ├── auth/             # Auth pages (login, register)
│   │   ├── dashboard/        # User dashboards
│   │   │   ├── patient/      # Patient dashboard
│   │   │   └── doctor/       # Doctor dashboard
│   │   ├── consultation/     # Video consultation room
│   │   ├── page.tsx          # Landing page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   └── lib/
│       ├── telehealth-db.ts  # Prisma client
│       └── telehealth-auth.ts # Auth utilities
├── prisma/
│   └── schema.prisma         # Database schema
└── public/
    └── logo.jpg              # App logo
```

## Deployment

This project is deployed on Vercel. To deploy your own instance:

1. Fork this repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

## License

MIT License - see LICENSE file for details.

## Contact

- Email: support@telehealthnigeria.com
- Phone: +234 700 TELEHEALTH
- Location: Lagos, Nigeria
