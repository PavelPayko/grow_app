const { DEFAULT_TEAM_NAME } = require('./competencyCatalogSeed')

async function assignUsersToDefaultTeam(client) {
  const teamResult = await client.query(
    'SELECT id FROM teams WHERE name = $1',
    [DEFAULT_TEAM_NAME]
  )

  if (teamResult.rows.length === 0) {
    throw new Error(
      `Команда "${DEFAULT_TEAM_NAME}" не найдена. Сначала выполните: npm run seed`
    )
  }

  const teamId = teamResult.rows[0].id

  const updateResult = await client.query(
    `UPDATE users
     SET team_id = $1
     WHERE team_id IS NULL
     RETURNING id`,
    [teamId]
  )

  console.log(
    `Назначено пользователей в "${DEFAULT_TEAM_NAME}": ${updateResult.rowCount}`
  )

  return updateResult.rowCount
}

module.exports = { assignUsersToDefaultTeam }
