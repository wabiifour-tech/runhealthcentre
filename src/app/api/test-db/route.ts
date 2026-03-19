import { NextResponse } from 'next/server'
import { getPrisma, testConnection } from '@/lib/db'

export async function GET() {
  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  }

  try {
    // Test connection
    const connectionTest = await testConnection()
    result.connectionTest = connectionTest

    if (!connectionTest.success) {
      result.error = connectionTest.message
      return NextResponse.json(result)
    }

    result.success = true

    const prisma = await getPrisma()
    const p = prisma as any

    // Try to query users table
    try {
      const usersCount = await p.users.count()
      result.usersCount = usersCount
    } catch (tableErr: any) {
      result.usersTableError = tableErr.message
    }
    
    // Try to query app_settings table
    try {
      const settings = await p.app_settings.findUnique({
        where: { id: 'default' }
      })
      result.settingsFound = !!settings
      if (settings) {
        result.settings = settings
      }
    } catch (settingsErr: any) {
      result.settingsTableError = settingsErr.message
    }
    
  } catch (err: any) {
    result.error = err.message
  }

  return NextResponse.json(result)
}
