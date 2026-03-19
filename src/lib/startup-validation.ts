// Startup Validation - Validates database configuration
import { getPool } from './db'
import { createLogger } from './logger'

const logger = createLogger('Startup')

export interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}

let cachedResult: ValidationResult | null = null

export async function validateDatabaseStartup(): Promise<ValidationResult> {
  if (cachedResult) return cachedResult

  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  }

  // Check 1: DATABASE_URL exists
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    result.errors.push('DATABASE_URL is not set')
    result.passed = false
    return result
  }

  // Check 2: DATABASE_URL is PostgreSQL (not SQLite)
  if (dbUrl.startsWith('file:')) {
    result.errors.push(`CRITICAL: DATABASE_URL points to SQLite (${dbUrl}). Use PostgreSQL.`)
    result.passed = false
    return result
  }

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    result.errors.push('DATABASE_URL must be a PostgreSQL connection string')
    result.passed = false
    return result
  }

  // Check 3: Can connect to database
  try {
    const pool = getPool()
    const conn = await pool.connect()
    await conn.query('SELECT 1')
    conn.release()
    logger.info('Database connection validated')
  } catch (error: any) {
    result.errors.push(`Database connection failed: ${error.message}`)
    result.passed = false
    return result
  }

  // Check 4: Critical tables exist
  try {
    const pool = getPool()
    const res = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'patients', 'consultations', 'vital_signs')
    `)
    const tables = res.rows.map(r => r.table_name)
    const missing = ['users', 'patients', 'consultations', 'vital_signs'].filter(t => !tables.includes(t))
    
    if (missing.length > 0) {
      result.errors.push(`Missing tables: ${missing.join(', ')}. Run: npx prisma db push`)
      result.passed = false
    }
  } catch (error: any) {
    result.warnings.push(`Could not verify tables: ${error.message}`)
  }

  cachedResult = result
  
  if (!result.passed) {
    console.error('\n' + '='.repeat(50))
    console.error('DATABASE VALIDATION FAILED')
    result.errors.forEach(e => console.error('  ❌', e))
    console.error('='.repeat(50) + '\n')
  } else {
    console.log('✅ Database validation passed')
  }

  return result
}

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const pool = getPool()
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  }
}
