# RUHC HMS Performance Optimization Roadmap

## Current Performance Status (March 2026)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Real Experience Score | 29 | 90+ | ❌ Poor |
| First Contentful Paint | 6.29s | <1.8s | ❌ Poor |
| Largest Contentful Paint | 14.28s | <2.5s | ❌ Poor |
| Interaction to Next Paint | 264ms | <200ms | ⚠️ Needs Work |
| Cumulative Layout Shift | 0.48 | <0.1 | ❌ Poor |
| Time to First Byte | 2.88s | <0.8s | ❌ Poor |

---

## Root Cause Analysis

### Primary Issues

1. **Monolithic Page Component**
   - File size: 1.3 MB (26,331 lines)
   - All features load at once
   - No code splitting

2. **Heavy Dependencies**
   - Recharts loaded on initial render
   - All icons imported (50+ Lucide icons)
   - Multiple utility libraries

3. **No Loading States**
   - Users see blank screen during load
   - No progressive rendering
   - Layout shift during hydration

---

## Quick Wins (Implemented Now)

### 1. Loading Skeleton ✅
- Added `loading.tsx` for immediate visual feedback
- Improves perceived performance
- Reduces bounce rate

### 2. Streaming Enabled
- Next.js automatic streaming active
- Progressive HTML delivery

---

## Phase 1: Immediate Improvements (Week 1)

### Priority: HIGH

#### 1.1 Code Splitting
Break the monolithic HMS page into separate route segments:
- `/hms/dashboard` - Dashboard
- `/hms/patients` - Patient Management
- `/hms/appointments` - Appointments
- `/hms/pharmacy` - Pharmacy
- `/hms/laboratory` - Laboratory
- `/hms/nursing` - Nursing Station
- `/hms/doctor` - Doctor's Portal
- `/hms/admin` - Admin Panel
- `/hms/accounts` - Accounts
- `/hms/settings` - Settings

#### 1.2 Lazy Load Charts
```tsx
// Instead of:
import { RevenueChart } from '@/components/charts'

// Use:
const RevenueChart = dynamic(
  () => import('@/components/charts').then(mod => mod.RevenueChart),
  { loading: () => <ChartSkeleton /> }
)
```

#### 1.3 Optimize Icons
```tsx
// Instead of importing all icons:
import { LogOut, Users, Calendar, ... } from 'lucide-react'

// Use tree-shaking friendly imports:
import LogOut from 'lucide-react/dist/esm/icons/log-out'
```

#### 1.4 Add Streaming Boundaries
```tsx
import { Suspense } from 'react'

<Suspense fallback={<DashboardSkeleton />}>
  <DashboardStats />
</Suspense>
```

---

## Phase 2: Database Optimization (Week 2)

### Priority: HIGH

#### 2.1 Add Database Indexes
```sql
CREATE INDEX idx_patients_hospital_number ON patients(hospital_number);
CREATE INDEX idx_patients_ruhc_code ON patients(ruhc_code);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_queue_status ON queue_entries(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
```

#### 2.2 Implement Pagination
- All list views should paginate (20-50 items)
- Add infinite scroll for better UX

#### 2.3 Add Caching
```tsx
// Use Next.js caching
export const revalidate = 60 // Cache for 60 seconds
```

---

## Phase 3: Component Refactoring (Week 3-4)

### Priority: MEDIUM

#### 3.1 Create Feature Modules
```
src/
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── patients/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── appointments/
│   ├── pharmacy/
│   ├── laboratory/
│   ├── nursing/
│   ├── doctor/
│   └── admin/
```

#### 3.2 Custom Hooks
```tsx
// Extract state logic into hooks
function usePatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  // ... fetch logic
  return { patients, loading, refetch }
}
```

---

## Phase 4: Advanced Optimization (Month 2)

### Priority: LOW

#### 4.1 Service Worker for Offline
- Cache API responses
- Enable offline mode
- Background sync

#### 4.2 Image Optimization
- Use Next.js Image component
- Add blur placeholders
- Lazy load images

#### 4.3 Server Components
- Convert read-only components to RSC
- Reduce client-side JavaScript

---

## Performance Budget

| Resource | Budget |
|----------|--------|
| Initial JS Bundle | <200 KB |
| Initial CSS Bundle | <50 KB |
| First Load JS | <300 KB |
| Time to Interactive | <3s |
| Total Page Weight | <1 MB |

---

## Expected Results After Full Implementation

| Metric | Current | Expected |
|--------|---------|----------|
| RES | 29 | 85-95 |
| FCP | 6.29s | <1.5s |
| LCP | 14.28s | <2.0s |
| INP | 264ms | <100ms |
| CLS | 0.48 | <0.05 |
| TTFB | 2.88s | <0.5s |

---

## Notes for ICT Team

1. **Database Migrations**: Run the index creation SQL before peak hours
2. **Caching**: Consider Redis for session and data caching
3. **CDN**: Ensure static assets are cached properly
4. **Monitoring**: Set up alerts for performance degradation
5. **Load Testing**: Run load tests before major deployments

---

Document created by: Development Team
Date: March 2026
Version: 1.0
