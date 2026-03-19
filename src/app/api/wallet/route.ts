// Patient Wallet API - PostgreSQL (Neon) Database Operations
// UPDATED: Now uses singleton pool from /lib/db.ts to prevent connection exhaustion
import { NextRequest, NextResponse } from 'next/server'
import { getPool, getPrisma } from '@/lib/db-bulletproof'
import { createLogger } from '@/lib/logger'

const logger = createLogger('WalletAPI')

// GET - Fetch wallet and transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const type = searchParams.get('type') || 'wallet'

    if (!patientId) {
      return NextResponse.json({ success: true, wallet: null, transactions: [] })
    }

    const pool = getPool()
    let wallet: any = null
    let transactions: any[] = []

    if (type === 'wallet' || type === 'all') {
      const walletResult = await pool.query(`SELECT * FROM patient_wallets WHERE "patientId" = $1`, [patientId])
      wallet = walletResult.rows.length > 0 ? walletResult.rows[0] : null

      if (!wallet) {
        // Create wallet if doesn't exist
        const newId = `wallet_${Date.now()}`
        const now = new Date()
        await pool.query(
          `INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt") VALUES ($1, $2, 0, TRUE, $3)`,
          [newId, patientId, now]
        )
        wallet = { id: newId, patientId, balance: 0, isActive: true, createdAt: now }
      }
    }

    if (type === 'transactions' || type === 'all') {
      const walletId = wallet?.id
      if (walletId) {
        const txnResult = await pool.query(
          `SELECT * FROM wallet_transactions WHERE "walletId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
          [walletId]
        )
        transactions = txnResult.rows || []
      }
    }

    return NextResponse.json({ success: true, wallet, transactions, method: 'direct-pg' })

  } catch (error: any) {
    logger.error('Error fetching wallet', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Credit or debit wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, type, amount, description, reference, createdBy } = body

    if (!patientId || !type || !amount) {
      return NextResponse.json({ success: false, error: 'patientId, type, and amount are required' }, { status: 400 })
    }

    if (!['credit', 'debit'].includes(type)) {
      return NextResponse.json({ success: false, error: 'type must be "credit" or "debit"' }, { status: 400 })
    }

    const pool = getPool()

    // Get or create wallet
    let walletResult = await pool.query(`SELECT * FROM patient_wallets WHERE "patientId" = $1`, [patientId])
    let wallet = walletResult.rows.length > 0 ? walletResult.rows[0] : null

    if (!wallet) {
      const newId = `wallet_${Date.now()}`
      const now = new Date()
      await pool.query(
        `INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt") VALUES ($1, $2, 0, TRUE, $3)`,
        [newId, patientId, now]
      )
      walletResult = await pool.query(`SELECT * FROM patient_wallets WHERE "patientId" = $1`, [patientId])
      wallet = walletResult.rows.length > 0 ? walletResult.rows[0] : null
    }

    const currentBalance = parseFloat(wallet?.balance) || 0
    const transactionAmount = parseFloat(amount)
    let newBalance: number

    if (type === 'credit') {
      newBalance = currentBalance + transactionAmount
    } else {
      if (currentBalance < transactionAmount) {
        return NextResponse.json({ success: false, error: 'Insufficient balance', currentBalance }, { status: 400 })
      }
      newBalance = currentBalance - transactionAmount
    }

    const now = new Date()
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create transaction record
    await pool.query(`
      INSERT INTO wallet_transactions (id, "walletId", type, amount, description, reference, "balanceAfter", "createdBy", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [transactionId, wallet.id, type, transactionAmount, description || null, reference || null, newBalance, createdBy || null, now])

    // Update wallet balance
    await pool.query(
      `UPDATE patient_wallets SET balance = $1, "lastTransactionAt" = $2 WHERE id = $3`,
      [newBalance, now, wallet.id]
    )
    
    logger.info('Wallet transaction completed', { transactionId, patientId, type, amount: transactionAmount, newBalance })
    return NextResponse.json({ 
      success: true, 
      transaction: { id: transactionId, walletId: wallet.id, type, amount: transactionAmount, description, reference, balanceAfter: newBalance, createdBy, createdAt: now },
      newBalance,
      method: 'direct-pg'
    })

  } catch (error: any) {
    logger.error('Error processing wallet transaction', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
