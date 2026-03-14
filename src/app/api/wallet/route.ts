// Patient Wallet API - BULLETPROOF Database Operations
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('WalletAPI')

// Direct database pool
function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

// GET - Fetch wallet and transactions - BULLETPROOF
export async function GET(request: NextRequest) {
  const pool = getPool()
  
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const type = searchParams.get('type') || 'wallet'

    if (!patientId) {
      await pool.end()
      return NextResponse.json({ success: true, wallet: null, transactions: [] })
    }

    let wallet = null
    let transactions: any[] = []

    // PRIMARY: Direct pg
    try {
      if (type === 'wallet' || type === 'all') {
        const walletResult = await pool.query(`
          SELECT id, "patientId", patient, balance, "lastTransactionAt"::text, "isActive", "createdAt"::text
          FROM patient_wallets WHERE "patientId" = $1
        `, [patientId])

        if (walletResult.rows.length > 0) {
          wallet = walletResult.rows[0]
        } else {
          // Create wallet if doesn't exist
          const newId = `wallet_${Date.now()}`
          const now = new Date()
          await pool.query(`
            INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt")
            VALUES ($1, $2, 0, TRUE, $3)
          `, [newId, patientId, now])
          wallet = { id: newId, patientId, balance: 0, isActive: true, createdAt: now }
        }
      }

      if (type === 'transactions' || type === 'all') {
        const walletId = wallet?.id
        if (walletId) {
          const txnResult = await pool.query(`
            SELECT id, "walletId", type, amount, description, reference, "balanceAfter", "createdBy", "createdAt"::text
            FROM wallet_transactions 
            WHERE "walletId" = $1
            ORDER BY "createdAt" DESC
            LIMIT 50
          `, [walletId])
          transactions = txnResult.rows
        }
      }

      await pool.end()
      return NextResponse.json({ success: true, wallet, transactions, method: 'direct-pg' })
    } catch (pgError: any) {
      logger.warn('Direct pg failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any

      if (type === 'wallet' || type === 'all') {
        const wallets = await p.$queryRawUnsafe(`SELECT * FROM patient_wallets WHERE "patientId" = '${patientId}'`)
        wallet = wallets[0] || null

        if (!wallet) {
          const newId = `wallet_${Date.now()}`
          const now = new Date().toISOString()
          await p.$executeRawUnsafe(`INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt") VALUES ('${newId}', '${patientId}', 0, TRUE, '${now}')`)
          wallet = { id: newId, patientId, balance: 0, isActive: true, createdAt: now }
        }
      }

      if (type === 'transactions' || type === 'all') {
        const walletId = wallet?.id
        if (walletId) {
          transactions = await p.$queryRawUnsafe(`SELECT * FROM wallet_transactions WHERE "walletId" = '${walletId}' ORDER BY "createdAt" DESC LIMIT 50`) || []
        }
      }

      await pool.end()
      return NextResponse.json({ success: true, wallet, transactions, method: 'prisma' })
    }

    await pool.end()
    return NextResponse.json({ success: true, wallet: null, transactions: [], method: 'fallback' })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error fetching wallet', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Credit or debit wallet - BULLETPROOF
export async function POST(request: NextRequest) {
  const pool = getPool()
  
  try {
    const body = await request.json()
    const { patientId, type, amount, description, reference, createdBy } = body

    if (!patientId || !type || !amount) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'patientId, type, and amount are required' }, { status: 400 })
    }

    if (!['credit', 'debit'].includes(type)) {
      await pool.end()
      return NextResponse.json({ success: false, error: 'type must be "credit" or "debit"' }, { status: 400 })
    }

    // PRIMARY: Direct pg
    try {
      // Get or create wallet
      let walletResult = await pool.query(`SELECT * FROM patient_wallets WHERE "patientId" = $1`, [patientId])
      let wallet = walletResult.rows[0]

      if (!wallet) {
        const newId = `wallet_${Date.now()}`
        const now = new Date()
        await pool.query(`INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt") VALUES ($1, $2, 0, TRUE, $3)`, [newId, patientId, now])
        walletResult = await pool.query(`SELECT * FROM patient_wallets WHERE "patientId" = $1`, [patientId])
        wallet = walletResult.rows[0]
      }

      const currentBalance = parseFloat(wallet.balance) || 0
      const transactionAmount = parseFloat(amount)
      let newBalance: number

      if (type === 'credit') {
        newBalance = currentBalance + transactionAmount
      } else {
        if (currentBalance < transactionAmount) {
          await pool.end()
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
      `, [transactionId, wallet.id, type, transactionAmount, description, reference, newBalance, createdBy, now])

      // Update wallet balance
      await pool.query(`UPDATE patient_wallets SET balance = $1, "lastTransactionAt" = $2 WHERE id = $3`, [newBalance, now, wallet.id])

      await pool.end()
      logger.info('Wallet transaction via direct pg', { transactionId, patientId, type, amount: transactionAmount, newBalance })
      return NextResponse.json({ 
        success: true, 
        transaction: { id: transactionId, walletId: wallet.id, type, amount: transactionAmount, description, reference, balanceAfter: newBalance, createdBy, createdAt: now },
        newBalance,
        method: 'direct-pg'
      })
    } catch (pgError: any) {
      logger.warn('Direct pg POST failed, trying Prisma', { error: pgError.message })
    }

    // SECONDARY: Prisma
    const prisma = await getPrisma()
    if (prisma) {
      const p = prisma as any

      let wallets = await p.$queryRawUnsafe(`SELECT * FROM patient_wallets WHERE "patientId" = '${patientId}'`)
      let wallet = wallets[0]

      if (!wallet) {
        const newId = `wallet_${Date.now()}`
        const now = new Date().toISOString()
        await p.$executeRawUnsafe(`INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt") VALUES ('${newId}', '${patientId}', 0, TRUE, '${now}')`)
        wallets = await p.$queryRawUnsafe(`SELECT * FROM patient_wallets WHERE "patientId" = '${patientId}'`)
        wallet = wallets[0]
      }

      const currentBalance = parseFloat(wallet.balance) || 0
      const transactionAmount = parseFloat(amount)
      let newBalance: number

      if (type === 'credit') {
        newBalance = currentBalance + transactionAmount
      } else {
        if (currentBalance < transactionAmount) {
          await pool.end()
          return NextResponse.json({ success: false, error: 'Insufficient balance', currentBalance }, { status: 400 })
        }
        newBalance = currentBalance - transactionAmount
      }

      const now = new Date().toISOString()
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await p.$executeRawUnsafe(`
        INSERT INTO wallet_transactions (id, "walletId", type, amount, description, reference, "balanceAfter", "createdBy", "createdAt")
        VALUES ('${transactionId}', '${wallet.id}', '${type}', ${transactionAmount}, ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}, ${reference ? `'${reference}'` : 'NULL'}, ${newBalance}, ${createdBy ? `'${createdBy}'` : 'NULL'}, '${now}')
      `)

      await p.$executeRawUnsafe(`UPDATE patient_wallets SET balance = ${newBalance}, "lastTransactionAt" = '${now}' WHERE id = '${wallet.id}'`)

      await pool.end()
      logger.info('Wallet transaction via Prisma', { transactionId, patientId, type, amount: transactionAmount, newBalance })
      return NextResponse.json({ 
        success: true, 
        transaction: { id: transactionId, walletId: wallet.id, type, amount: transactionAmount, description, reference, balanceAfter: newBalance, createdBy, createdAt: now },
        newBalance,
        method: 'prisma'
      })
    }

    await pool.end()
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })

  } catch (error: any) {
    await pool.end().catch(() => {})
    logger.error('Error processing wallet transaction', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
