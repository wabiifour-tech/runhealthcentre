// Database Migration API - Add new columns for password and session management
import { NextRequest, NextResponse } from 'next/server'

// GET - Run migration checks
export async function GET() {
  try {
    const { getPrisma } = await import('@/lib/db')
    const prisma = getPrisma()
    
    if (!prisma) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not available' 
      }, { status: 503 })
    }

    const p = prisma as any
    
    // SQL to add new columns if they don't exist
    const migrationSQL = `
      -- Add must_change_password column if it doesn't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'must_change_password') THEN
          ALTER TABLE "User" ADD COLUMN "must_change_password" BOOLEAN DEFAULT true;
        END IF;
      END $$;

      -- Add current_session_id column if it doesn't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'current_session_id') THEN
          ALTER TABLE "User" ADD COLUMN "current_session_id" TEXT;
        END IF;
      END $$;

      -- Add last_session_at column if it doesn't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'last_session_at') THEN
          ALTER TABLE "User" ADD COLUMN "last_session_at" TIMESTAMP(3);
        END IF;
      END $$;

      -- Create UserSession table if it doesn't exist
      CREATE TABLE IF NOT EXISTS "UserSession" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "session_id" TEXT NOT NULL,
        "device_info" TEXT,
        "ip_address" TEXT,
        "is_active" BOOLEAN DEFAULT true,
        "started_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "ended_at" TIMESTAMP(3),
        "last_activity_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "UserSession_session_id_key" UNIQUE ("session_id")
      );

      -- Add foreign key constraint if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'UserSession_user_id_fkey'
        ) THEN
          ALTER TABLE "UserSession" 
          ADD CONSTRAINT "UserSession_user_id_fkey" 
          FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;

      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS "UserSession_user_id_idx" ON "UserSession"("user_id");
      CREATE INDEX IF NOT EXISTS "UserSession_session_id_idx" ON "UserSession"("session_id");
    `

    // Execute migration
    try {
      await p.$executeRawUnsafe(migrationSQL)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database migration completed successfully',
        migrations: [
          'Added must_change_password column to User table',
          'Added current_session_id column to User table',
          'Added last_session_at column to User table',
          'Created UserSession table with indexes'
        ]
      })
    } catch (sqlError: any) {
      console.log('SQL Migration error:', sqlError.message)
      
      // Return the SQL for manual execution
      return NextResponse.json({ 
        success: false, 
        error: 'Could not run automatic migration. Please run the SQL manually in Supabase.',
        sql: migrationSQL
      })
    }

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
