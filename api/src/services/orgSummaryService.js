const pool = require('../config/db')
const { calculateTeamAggregates } = require('./assessmentAggregateService')
const { getManagedTeamIds } = require('./managedTeamsService')

function round(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }
  return Number(Number(value).toFixed(digits))
}

exports.getOrgSummary = async (actor) => {
  let teamsResult

  if (actor.role === 'admin') {
    teamsResult = await pool.query(
      'SELECT id, name FROM teams ORDER BY name'
    )
  } else if (actor.role === 'lead') {
    const managedTeamIds = Array.isArray(actor.managed_team_ids)
      ? actor.managed_team_ids
      : await getManagedTeamIds(actor.id)

    if (!managedTeamIds.length) {
      return []
    }

    teamsResult = await pool.query(
      'SELECT id, name FROM teams WHERE id = ANY($1::uuid[]) ORDER BY name',
      [managedTeamIds]
    )
  } else {
    return []
  }

  const summary = []

  for (const team of teamsResult.rows) {
    const membersResult = await pool.query(
      'SELECT COUNT(*)::int AS member_count FROM users WHERE team_id = $1',
      [team.id]
    )
    const member_count = membersResult.rows[0].member_count

    const cycleResult = await pool.query(
      `SELECT id, name, status
       FROM assessment_cycles
       WHERE team_id = $1
       ORDER BY
         CASE status
           WHEN 'active' THEN 0
           WHEN 'draft' THEN 1
           ELSE 2
         END,
         created_at DESC
       LIMIT 1`,
      [team.id]
    )

    if (!cycleResult.rowCount) {
      summary.push({
        team_id: team.id,
        team_name: team.name,
        cycle_id: null,
        cycle_name: null,
        cycle_status: 'not_started',
        avg_fill_rate: null,
        member_count,
      })
      continue
    }

    const cycle = cycleResult.rows[0]
    let avg_fill_rate = null

    if (cycle.status === 'active' || cycle.status === 'closed') {
      const aggregates = await calculateTeamAggregates({ cycle_id: cycle.id })
      if (aggregates.length) {
        const totalFill = aggregates.reduce((sum, user) => sum + (user.fill_rate || 0), 0)
        avg_fill_rate = round(totalFill / aggregates.length)
      } else {
        avg_fill_rate = 0
      }
    }

    summary.push({
      team_id: team.id,
      team_name: team.name,
      cycle_id: cycle.id,
      cycle_name: cycle.name,
      cycle_status: cycle.status,
      avg_fill_rate,
      member_count,
    })
  }

  return summary
}
