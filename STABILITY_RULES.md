# HMS STABILITY PROTECTIONS - DEVELOPMENT RULES

## 🔒 MANDATORY RULES - NEVER BREAK THESE

### RULE 1: DO NOT BREAK WORKING FEATURES

Before editing any code:
- [ ] Identify features that are already working
- [ ] Do not modify their logic unless absolutely necessary
- [ ] If a fix requires touching working code, explain why
- [ ] Working features MUST remain stable

### RULE 2: TRACE BEFORE MODIFYING

Before changing anything, trace the full execution path:
```
Frontend Component
→ Event Handler
→ API Call
→ Backend Route
→ Controller Logic
→ Database Query
→ Response
```

- Only modify the exact layer where the issue occurs
- Do not rewrite unrelated parts of the system

### RULE 3: SMALL CONTROLLED CHANGES

All fixes must be:
- ✅ Minimal
- ✅ Isolated
- ✅ Reversible

Avoid large rewrites that could introduce new bugs.

### RULE 4: VERIFY DATABASE SAFETY

Never perform actions that could:
- ❌ Delete existing patient records
- ❌ Reset database tables
- ❌ Overwrite stored data
- ❌ Clear in-memory caches that affect persistence

Medical data must ALWAYS remain safe.

### RULE 5: PRESERVE DATA MODELS

Do not change database schemas unless required.

If schema updates are necessary:
1. Use Prisma migrations
2. Maintain backward compatibility
3. Existing records must remain accessible

```bash
# Correct way to update schema
npx prisma migrate dev --name descriptive_change_name
```

### RULE 6: PROTECT API CONTRACTS

Do not change API request/response structures without ensuring frontend compatibility.

If API changes are necessary:
1. Update both backend and frontend safely
2. Maintain consistent response structure
3. Version the API if breaking changes needed

### RULE 7: TEST BEFORE AND AFTER FIXES

**Before applying a fix:**
- Identify affected features

**After applying a fix:**
- Verify the original issue is resolved
- Confirm previously working features still function

### RULE 8: IMPLEMENT REGRESSION PROTECTION

Create tests for critical HMS functions:
- Patient registration
- User registration
- Patient retrieval
- Medical record creation

These tests ensure future updates do not break core features.

### RULE 9: LOG ALL ERRORS

Implement structured logging for:
- Database errors
- API errors
- Authentication failures

Logs should help diagnose problems without breaking the system.

### RULE 10: SAFE DEVELOPMENT PRINCIPLE

**All development must follow this rule:**

> Never introduce new bugs while fixing existing ones.
> 
> If a change risks breaking other features, propose a safer alternative.

---

## 📋 PROJECT STRUCTURE - CLEAN ARCHITECTURE

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── patients/      # Patient endpoints
│   │   ├── users/         # User endpoints
│   │   ├── consultations/ # Consultation endpoints
│   │   ├── vitals/        # Vitals endpoints
│   │   └── system/        # System health endpoints
│   └── hms/               # HMS Frontend Page
│
├── modules/               # Feature Modules
│   ├── patients/
│   │   ├── services/      # Business logic
│   │   └── repositories/  # Database operations
│   ├── consultations/
│   │   ├── services/
│   │   └── repositories/
│   └── triage/
│       ├── services/
│       └── repositories/
│
├── lib/                   # Shared Libraries
│   ├── db.ts             # Database connection
│   ├── validation.ts     # Input validation
│   ├── api-response.ts   # Response standards
│   ├── error-logging.ts  # Structured logging
│   └── auth-middleware.ts # Authentication
│
├── generated/            # Generated Code
│   └── prisma/          # Prisma client
│
└── __tests__/           # Test Files
    └── core-functionality.test.ts
```

---

## 📡 API RESPONSE STANDARDS

All API responses MUST follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "requestId": "req_abc123"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "requestId": "req_abc123"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
```

---

## 🔍 HEALTH CHECK ENDPOINT

**GET /api/system/health**

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00Z",
    "version": "1.0.0",
    "checks": {
      "database": { "status": "healthy", "latency": 15 },
      "api": { "status": "healthy" },
      "storage": { "status": "healthy" }
    }
  }
}
```

---

## 🚨 PREVENT DATA LOSS

The system must NEVER:
- Clear tables automatically
- Reset data on server restart
- Use in-memory data for core records
- Delete records without explicit user action

### Database Safety Checklist
- [ ] SQLite database file exists at `/db/custom.db`
- [ ] Migrations are version controlled
- [ ] No auto-clear scripts
- [ ] No `DROP TABLE` in production code
- [ ] Foreign keys are enforced

---

## ✅ FINAL REQUIREMENT

The Health Management System must remain stable and reliable.

All fixes must:
1. ✅ Preserve existing functionality
2. ✅ Maintain database integrity
3. ✅ Keep API communication stable
4. ✅ Prevent accidental data loss

**The goal is to stabilize the system while gradually improving it without introducing regressions.**

---

## 📞 QUICK REFERENCE

| Task | Command |
|------|---------|
| Generate Prisma Client | `npx prisma generate` |
| Run Migrations | `npx prisma migrate dev` |
| Check Database | `npx prisma db push` |
| Build Project | `bun run build` |
| Run Dev Server | `bun run dev` |
| Run Tests | `bun test` |

---

*Last Updated: March 2026*
*Version: 2.0 - Stability Protections*
