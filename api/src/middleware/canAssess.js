const pool = require('../config/db')
const { getManagedTeamIds } = require('../services/managedTeamsService')
const { getCycleById } = require('../services/assessmentCycleService')

async function resolveManagedTeamIds(actor) {
  if (actor.role !== 'lead') return []
  if (Array.isArray(actor.managed_team_ids)) {
    return actor.managed_team_ids
  }
  if (actor.id) {
    return getManagedTeamIds(actor.id)
  }
  return []
}

function canAssessByRole(actorRole, managedTeamIds, targetTeamId) {
  switch (actorRole) {
    case 'admin':
      return true
    case 'lead':
      return Boolean(targetTeamId && managedTeamIds?.includes(targetTeamId))
    default:
      return false
  }
}

exports.canAssessByRole = canAssessByRole

exports.managesTeam = async (actor, teamId) => {
  if (!actor || !teamId) {
    return false
  }
  if (actor.role === 'admin') {
    return true
  }
  if (actor.role !== 'lead') {
    return false
  }
  const managedTeamIds = await resolveManagedTeamIds(actor)
  return managedTeamIds.includes(teamId)
}

exports.canAccessTeam = exports.managesTeam

exports.canViewUser = async (actor, targetUserId) => {
  if (!actor?.id || !targetUserId) {
    return false
  }
  if (actor.role === 'admin') {
    return true
  }
  if (actor.id === targetUserId) {
    return true
  }
  if (actor.role !== 'lead') {
    return false
  }

  const targetResult = await pool.query('SELECT team_id FROM users WHERE id = $1', [targetUserId])
  if (!targetResult.rowCount) {
    return false
  }

  const targetTeamId = targetResult.rows[0].team_id
  if (!targetTeamId) {
    return false
  }

  return exports.managesTeam(actor, targetTeamId)
}

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
  const actorRole = actorRow?.role || actor.role
  const targetTeamId = targetResult.rows[0].team_id

  if (actorRole === 'lead') {
    const managedTeamIds = await resolveManagedTeamIds(actor)
    return canAssessByRole('lead', managedTeamIds, targetTeamId)
  }

  return canAssessByRole(actorRole, null, targetTeamId)
}

exports.canViewAssessment = exports.canViewUser

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

exports.requireAdminOrLead = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'lead') {
    return next()
  }
  return res.status(403).json({ error: 'Нет доступа' })
}

exports.requireCanAccessTeam = async (req, res, next) => {
  const teamId = req.params.teamId
  if (!teamId) {
    return res.status(400).json({ error: 'teamId обязателен' })
  }

  try {
    const allowed = await exports.canAccessTeam(req.user, teamId)
    if (!allowed) {
      return res.status(403).json({ error: 'Нет доступа к команде' })
    }
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.requireCanAccessCycle = async (req, res, next) => {
  const cycleId = req.params.cycleId
  if (!cycleId) {
    return res.status(400).json({ error: 'cycleId обязателен' })
  }

  try {
    const cycleResult = await getCycleById({ id: cycleId })
    if (!cycleResult.rowCount) {
      return res.status(404).json({ error: 'Цикл не найден' })
    }

    const allowed = await exports.canAccessTeam(req.user, cycleResult.rows[0].team_id)
    if (!allowed) {
      return res.status(403).json({ error: 'Нет доступа к команде' })
    }

    req.cycle = cycleResult.rows[0]
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
