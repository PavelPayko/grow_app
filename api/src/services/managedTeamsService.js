const pool = require('../config/db')

exports.getManagedTeamIds = async (userId) => {
  const result = await pool.query(
    'SELECT team_id FROM user_managed_teams WHERE user_id = $1 ORDER BY team_id',
    [userId]
  )
  return result.rows.map((row) => row.team_id)
}

exports.replaceManagedTeams = async (userId, teamIds) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM user_managed_teams WHERE user_id = $1', [userId])
    if (teamIds?.length) {
      for (const teamId of teamIds) {
        await client.query(
          'INSERT INTO user_managed_teams (user_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, teamId]
        )
      }
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

exports.clearManagedTeams = async (userId) => {
  await pool.query('DELETE FROM user_managed_teams WHERE user_id = $1', [userId])
}

exports.syncManagedTeamsForRole = async (userId, role, managedTeamIds) => {
  if (role === 'lead') {
    await exports.replaceManagedTeams(userId, managedTeamIds || [])
  } else {
    await exports.clearManagedTeams(userId)
  }
}
