const { Pool } = require('pg')

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Check if user exists
    const result = await pool.query(`
      SELECT id, email, name, role, "isActive", "approvalStatus", "viewablePassword", "createdAt"::text
      FROM users 
      WHERE email LIKE '%rose%'
         OR email LIKE '%adeleke%'
         OR name ILIKE '%rose%'
         OR name ILIKE '%adeleke%'
    `)
    
    console.log('Found users:', JSON.stringify(result.rows, null, 2))
    
    // Check all users count
    const countResult = await pool.query('SELECT COUNT(*) FROM users')
    console.log('Total users:', countResult.rows[0].count)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

test()
