// Analytics API for Redeemer's University Health Centre (RUHC) HMS
// Provides aggregated statistics for dashboards and reports
import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import { errorResponse, successResponse } from '@/lib/errors'

const logger = createLogger('AnalyticsAPI')

// Helper function to get Prisma client
async function getPrisma() {
  try {
    const { getPrisma: getClient } = await import('@/lib/db')
    return await getClient()
  } catch (e) {
    logger.error('Failed to get Prisma client', { error: String(e) })
    return null
  }
}

// GET analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const prisma = await getPrisma()
    
    if (!prisma) {
      return successResponse({ data: getDemoAnalytics(type), mode: 'demo' })
    }
    
    const p = prisma as any
    
    try {
      switch (type) {
        case 'daily-patients': {
          // Get daily patient counts for last 30 days
          const dailyData = await getDailyPatientCounts(p, 30)
          return successResponse({ data: dailyData })
        }
        
        case 'monthly-patients': {
          // Get monthly patient counts for last 12 months
          const monthlyData = await getMonthlyPatientCounts(p, 12)
          return successResponse({ data: monthlyData })
        }
        
        case 'semester-patients': {
          // Get semester/session breakdown
          const semesterData = await getSemesterPatientCounts(p)
          return successResponse({ data: semesterData })
        }
        
        case 'yearly-patients': {
          // Get yearly comparison
          const yearlyData = await getYearlyPatientCounts(p)
          return successResponse({ data: yearlyData })
        }
        
        case 'prevalence': {
          // Get prevalence data (most common diagnoses)
          const period = searchParams.get('period') || 'month'
          const prevalenceData = await getPrevalenceData(p, period)
          return successResponse({ data: prevalenceData })
        }
        
        case 'overview': {
          // Get comprehensive overview
          const [daily, monthly, semester, yearly, prevalence] = await Promise.all([
            getDailyPatientCounts(p, 30),
            getMonthlyPatientCounts(p, 12),
            getSemesterPatientCounts(p),
            getYearlyPatientCounts(p),
            getPrevalenceData(p, 'month')
          ])
          
          return successResponse({ 
            data: { 
              daily, 
              monthly, 
              semester, 
              yearly,
              prevalence
            } 
          })
        }
        
        default:
          return successResponse({ data: getDemoAnalytics('overview'), mode: 'demo' })
      }
    } catch (dbError: any) {
      logger.error('Database error in analytics', { error: dbError.message })
      return successResponse({ data: getDemoAnalytics(type), mode: 'demo' })
    }
  } catch (error) {
    return errorResponse(error, { module: 'AnalyticsAPI', operation: 'get' })
  }
}

// Helper functions for analytics calculations
async function getDailyPatientCounts(prisma: any, days: number) {
  const result = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    try {
      // Count patients registered on this date
      const count = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM patients 
        WHERE DATE("registeredAt") = '${dateStr}'
      `)
      
      // Count consultations on this date
      const consultationCount = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM consultations 
        WHERE DATE("createdAt") = '${dateStr}'
      `)
      
      result.push({
        date: dateStr,
        label: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        patients: parseInt(count[0]?.count || '0'),
        consultations: parseInt(consultationCount[0]?.count || '0')
      })
    } catch {
      result.push({
        date: dateStr,
        label: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        patients: 0,
        consultations: 0
      })
    }
  }
  
  return result
}

async function getMonthlyPatientCounts(prisma: any, months: number) {
  const result = []
  const today = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthStr = date.toISOString().slice(0, 7) // YYYY-MM
    
    try {
      const count = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM patients 
        WHERE TO_CHAR("registeredAt", 'YYYY-MM') = '${monthStr}'
      `)
      
      const consultationCount = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM consultations 
        WHERE TO_CHAR("createdAt", 'YYYY-MM') = '${monthStr}'
      `)
      
      result.push({
        month: monthStr,
        label: date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
        patients: parseInt(count[0]?.count || '0'),
        consultations: parseInt(consultationCount[0]?.count || '0')
      })
    } catch {
      result.push({
        month: monthStr,
        label: date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
        patients: 0,
        consultations: 0
      })
    }
  }
  
  return result
}

async function getSemesterPatientCounts(prisma: any) {
  const result = []
  const today = new Date()
  const currentYear = today.getFullYear()
  
  // Nigerian academic year: 
  // First Semester: September - January (Rain semester)
  // Second Semester: February - June (Harmattan semester)
  // Summer/Session: July - August
  
  const semesters = [
    { name: 'Rain Semester (Sep-Jan)', start: '-09-01', end: '-01-31', year: currentYear },
    { name: 'Harmattan Semester (Feb-Jun)', start: '-02-01', end: '-06-30', year: currentYear },
    { name: 'Summer Session (Jul-Aug)', start: '-07-01', end: '-08-31', year: currentYear }
  ]
  
  for (const sem of semesters) {
    try {
      const startDate = `${sem.year}${sem.start}`
      const endDate = sem.name.includes('Jan') ? `${sem.year + 1}${sem.end}` : `${sem.year}${sem.end}`
      
      const count = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM patients 
        WHERE DATE("registeredAt") >= '${startDate}' AND DATE("registeredAt") <= '${endDate}'
      `)
      
      result.push({
        semester: sem.name,
        year: sem.year,
        patients: parseInt(count[0]?.count || '0')
      })
    } catch {
      result.push({
        semester: sem.name,
        year: sem.year,
        patients: 0
      })
    }
  }
  
  return result
}

async function getYearlyPatientCounts(prisma: any) {
  const result = []
  const currentYear = new Date().getFullYear()
  
  for (let year = currentYear - 4; year <= currentYear; year++) {
    try {
      const count = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM patients 
        WHERE EXTRACT(YEAR FROM "registeredAt") = ${year}
      `)
      
      const consultationCount = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM consultations 
        WHERE EXTRACT(YEAR FROM "createdAt") = ${year}
      `)
      
      result.push({
        year,
        patients: parseInt(count[0]?.count || '0'),
        consultations: parseInt(consultationCount[0]?.count || '0')
      })
    } catch {
      result.push({ year, patients: 0, consultations: 0 })
    }
  }
  
  return result
}

async function getPrevalenceData(prisma: any, period: string) {
  let whereClause = ''
  const today = new Date()
  
  switch (period) {
    case 'today':
      whereClause = `WHERE DATE("createdAt") = '${today.toISOString().split('T')[0]}'`
      break
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      whereClause = `WHERE DATE("createdAt") >= '${weekAgo.toISOString().split('T')[0]}'`
      break
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      whereClause = `WHERE DATE("createdAt") >= '${monthAgo.toISOString().split('T')[0]}'`
      break
    case 'semester':
      const semesterStart = new Date(today.getFullYear(), 8, 1) // September
      whereClause = `WHERE DATE("createdAt") >= '${semesterStart.toISOString().split('T')[0]}'`
      break
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1)
      whereClause = `WHERE DATE("createdAt") >= '${yearStart.toISOString().split('T')[0]}'`
      break
    default:
      whereClause = ''
  }
  
  try {
    const diagnoses = await prisma.$queryRawUnsafe(`
      SELECT COALESCE("finalDiagnosis", "provisionalDiagnosis") as diagnosis, COUNT(*) as count
      FROM consultations
      ${whereClause}
      AND ("finalDiagnosis" IS NOT NULL OR "provisionalDiagnosis" IS NOT NULL)
      GROUP BY COALESCE("finalDiagnosis", "provisionalDiagnosis")
      ORDER BY count DESC
      LIMIT 10
    `)
    
    const total = Array.isArray(diagnoses) ? diagnoses.reduce((sum: number, d: any) => sum + parseInt(d.count), 0) : 0
    
    return Array.isArray(diagnoses) ? diagnoses.map((d: any) => ({
      name: d.diagnosis?.substring(0, 30) + (d.diagnosis?.length > 30 ? '...' : ''),
      fullName: d.diagnosis,
      count: parseInt(d.count),
      percentage: total > 0 ? Math.round((parseInt(d.count) / total) * 100) : 0
    })) : []
  } catch {
    return []
  }
}

// Demo data for when database is not available
function getDemoAnalytics(type: string) {
  const today = new Date()
  
  switch (type) {
    case 'daily-patients':
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
          patients: Math.floor(Math.random() * 15) + 5,
          consultations: Math.floor(Math.random() * 20) + 8
        }
      })
    
    case 'monthly-patients':
      return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        return {
          month: date.toISOString().slice(0, 7),
          label: date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
          patients: Math.floor(Math.random() * 100) + 30,
          consultations: Math.floor(Math.random() * 150) + 50
        }
      })
    
    case 'semester-patients':
      return [
        { semester: 'Rain Semester (Sep-Jan)', year: today.getFullYear(), patients: Math.floor(Math.random() * 200) + 100 },
        { semester: 'Harmattan Semester (Feb-Jun)', year: today.getFullYear(), patients: Math.floor(Math.random() * 250) + 150 },
        { semester: 'Summer Session (Jul-Aug)', year: today.getFullYear(), patients: Math.floor(Math.random() * 80) + 30 }
      ]
    
    case 'yearly-patients':
      return Array.from({ length: 5 }, (_, i) => {
        const year = today.getFullYear() - 4 + i
        return {
          year,
          patients: Math.floor(Math.random() * 500) + 200,
          consultations: Math.floor(Math.random() * 800) + 300
        }
      })
    
    case 'prevalence':
      const diagnoses = [
        'Malaria', 'Upper Respiratory Tract Infection', 'Gastroenteritis', 
        'Hypertension', 'Diabetes Mellitus', 'Typhoid Fever',
        'Urinary Tract Infection', 'Peptic Ulcer Disease', 'Low Back Pain', 'Allergic Rhinitis'
      ]
      return diagnoses.map((name, i) => ({
        name,
        fullName: name,
        count: Math.floor(Math.random() * 50) + 10 - i * 3,
        percentage: Math.floor(Math.random() * 15) + 5
      }))
    
    default:
      return {
        daily: getDemoAnalytics('daily-patients'),
        monthly: getDemoAnalytics('monthly-patients'),
        semester: getDemoAnalytics('semester-patients'),
        yearly: getDemoAnalytics('yearly-patients'),
        prevalence: getDemoAnalytics('prevalence')
      }
  }
}
