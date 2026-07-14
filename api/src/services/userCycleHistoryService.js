const pool = require('../config/db')
const { calculateUserAggregates } = require('./assessmentAggregateService')

exports.getUserCycleHistory = async (userId) => {
  const userResult = await pool.query('SELECT team_id FROM users WHERE id = $1', [userId])
  if (!userResult.rowCount || !userResult.rows[0].team_id) {
    return []
  }

  const teamId = userResult.rows[0].team_id
  const cyclesResult = await pool.query(
    `SELECT id, name, status, start_date, created_at
     FROM assessment_cycles
     WHERE team_id = $1 AND status IN ('active', 'closed')
     ORDER BY COALESCE(start_date, created_at)`,
    [teamId]
  )

  const history = []
  for (const cycle of cyclesResult.rows) {
    const aggregates = await calculateUserAggregates({
      cycle_id: cycle.id,
      user_id: userId,
    })
    history.push({
      cycle_id: cycle.id,
      cycle_name: cycle.name,
      cycle_status: cycle.status,
      weighted_total: aggregates.weighted_total,
      fill_rate: aggregates.fill_rate,
      blocks: aggregates.blocks,
    })
  }

  return history
}
