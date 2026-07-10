const pool = require('./src/config/db')
const { assignUsersToDefaultTeam } = require('./src/config/seed/assignUsersToDefaultTeam')

;(async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await assignUsersToDefaultTeam(client)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Ошибка миграции пользователей:', err.stack || err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
})()
