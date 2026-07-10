const pool = require('../config/db')

function canAssessByRole(actorRole, actorTeamId, targetTeamId) {
  switch (actorRole) {
    case 'admin':
      return true
    case 'team_lead':
      return Boolean(actorTeamId && targetTeamId && actorTeamId === targetTeamId)
    case 'pm':
      return Boolean(actorTeamId && targetTeamId && actorTeamId === targetTeamId)
    default:
      return false
  }
}

exports.canAssessByRole = canAssessByRole

exports.canAssess = async (actor, targetUserId) => {
  if (!actor?.id || !targetUserId) {
    return false
  }

  if (actor.role === 'admin') {
    return true
  }

  const [actorResult, targetResult] = await Promise.all([
    pool.query('SELECT team_id, role FROM users WHERE id = $1', [actor.id]),
    pool.query('SELECT team_id FROM users WHERE id = $1', [targetUserId]),
  ])

  if (!targetResult.rowCount) {
    return false
  }

  const actorRow = actorResult.rows[0]
  const targetTeamId = targetResult.rows[0].team_id

  return canAssessByRole(actorRow?.role || actor.role, actorRow?.team_id, targetTeamId)
}

exports.canViewAssessment = (actor, targetUserId) => {
  if (!actor?.id || !targetUserId) {
    return false
  }
  return actor.role === 'admin' || actor.id === targetUserId
}

exports.requireCanAssess = async (req, res, next) => {
  try {
    const allowed = await exports.canAssess(req.user, req.params.userId)

    if (!allowed) {
      return res.status(403).json({ error: 'Нет доступа для изменения оценок' })
    }

    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
