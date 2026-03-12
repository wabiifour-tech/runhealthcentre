// Patient Wallet API - For managing patient payment accounts
import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const logger = createLogger('WalletAPI')

// GET - Fetch wallet and transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const type = searchParams.get('type') || 'wallet' // 'wallet', 'transactions', or 'all'
    
    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: true, wallet: null, transactions: [], mode: 'demo' })
    }

    const p = prisma as any

    let wallet = null
    let transactions: any[] = []

    if (patientId) {
      if (type === 'wallet' || type === 'all') {
        const wallets = await p.$queryRawUnsafe(`
          SELECT * FROM patient_wallets WHERE "patientId" = '${patientId}'
        `)
        wallet = wallets[0] || null

        // Create wallet if doesn't exist
        if (!wallet) {
          const newId = `wallet_${Date.now()}`
          const now = new Date().toISOString()
          await p.$executeRawUnsafe(`
            INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt")
            VALUES ('${newId}', '${patientId}', 0, TRUE, '${now}')
          `)
          wallet = { id: newId, patientId, balance: 0, isActive: true, createdAt: now }
        }
      }

      if (type === 'transactions' || type === 'all') {
        const walletId = wallet?.id || (await p.$queryRawUnsafe(`
          SELECT id FROM patient_wallets WHERE "patientId" = '${patientId}'
        `))?.[0]?.id

        if (walletId) {
          transactions = await p.$queryRawUnsafe(`
            SELECT * FROM wallet_transactions 
            WHERE "walletId" = '${walletId}'
            ORDER BY "createdAt" DESC
            LIMIT 50
          `) || []
        }
      }
    }

    return NextResponse.json({ success: true, wallet, transactions })
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
      return NextResponse.json({ 
        success: false, 
        error: 'patientId, type, and amount are required' 
      }, { status: 400 })
    }

    if (!['credit', 'debit'].includes(type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'type must be "credit" or "debit"' 
      }, { status: 400 })
    }

    const prisma = await getPrisma()
    if (!prisma) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
    }

    const p = prisma as any

    // Get current wallet
    let wallets = await p.$queryRawUnsafe(`
      SELECT * FROM patient_wallets WHERE "patientId" = '${patientId}'
    `)

    let wallet = wallets[0]
    if (!wallet) {
      // Create wallet if doesn't exist
      const newId = `wallet_${Date.now()}`
      const now = new Date().toISOString()
      await p.$executeRawUnsafe(`
        INSERT INTO patient_wallets (id, "patientId", balance, "isActive", "createdAt")
        VALUES ('${newId}', '${patientId}', 0, TRUE, '${now}')
      `)
      wallets = await p.$queryRawUnsafe(`
        SELECT * FROM patient_wallets WHERE "patientId" = '${patientId}'
      `)
      wallet = wallets[0]
    }

    const currentBalance = parseFloat(wallet.balance) || 0
    const transactionAmount = parseFloat(amount)
    let newBalance: number

    if (type === 'credit') {
      newBalance = currentBalance + transactionAmount
    } else {
      if (currentBalance < transactionAmount) {
        return NextResponse.json({ 
          success: false, 
          error: 'Insufficient balance',
          currentBalance 
        }, { status: 400 })
      }
      newBalance = currentBalance - transactionAmount
    }

    const now = new Date().toISOString()
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create transaction record
    await p.$executeRawUnsafe(`
      INSERT INTO wallet_transactions (
        id, "walletId", type, amount, description, reference, "balanceAfter", "createdBy", "createdAt"
      ) VALUES (
        '${transactionId}',
        '${wallet.id}',
        '${type}',
        ${transactionAmount},
        ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'},
        ${reference ? `'${reference}'` : 'NULL'},
        ${newBalance},
        ${createdBy ? `'${createdBy}'` : 'NULL'},
        '${now}'
      )
    `)

    // Update wallet balance
    await p.$executeRawUnsafe(`
      UPDATE patient_wallets 
      SET balance = ${newBalance}, "lastTransactionAt" = '${now}'
      WHERE id = '${wallet.id}'
    `)

    logger.info('Wallet transaction recorded', { 
      transactionId, 
      patientId, 
      type, 
      amount: transactionAmount, 
      newBalance 
    })

    return NextResponse.json({ 
      success: true, 
      transaction: {
        id: transactionId,
        walletId: wallet.id,
        type,
        amount: transactionAmount,
        description,
        reference,
        balanceAfter: newBalance,
        createdBy,
        createdAt: now
      },
      newBalance
    })
  } catch (error: any) {
    logger.error('Error processing wallet transaction', { error: error.message })
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
