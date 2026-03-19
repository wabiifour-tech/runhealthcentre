import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// API to add missing columns to the consultations table
export async function GET(request: NextRequest) {
  try {
    const pool = getPool()
    
    // Columns to add if they don't exist
    const columnsToAdd = [
      'assignedNurseId TEXT',
      'assignedNurseName TEXT',
      'assignedPharmacistId TEXT',
      'assignedPharmacistName TEXT',
      'assignedLabTechId TEXT',
      'assignedLabTechName TEXT',
      'assignedRecordsId TEXT',
      'assignedRecordsName TEXT',
    ]
    
    const results = []
    
    for (const colDef of columnsToAdd) {
      const colName = colDef.split(' ')[0]
      try {
        // Check if column exists
        const checkResult = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'consultations' 
          AND column_name = $1
        `, [colName])
        
        if (checkResult.rows.length === 0) {
          // Add the column
          await pool.query(`ALTER TABLE consultations ADD COLUMN "${colName}" TEXT`)
          results.push({ column: colName, status: 'added' })
        } else {
          results.push({ column: colName, status: 'already_exists' })
        }
      } catch (e: any) {
        results.push({ column: colName, status: 'error', error: e.message })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed',
      results 
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
    error: error.message 
  }, { status: 500 })
  }
}
