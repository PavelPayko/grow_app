const pool = require('../config/db')
const { getManagedTeamIds } = require('./managedTeamsService')

exports.getAllTeams = async () => {
  const result = await pool.query(
    `SELECT t.id, t.name, t.catalog_id, t.created_at, c.name AS catalog_name
     FROM teams t
     LEFT JOIN competency_catalogs c ON c.id = t.catalog_id
     ORDER BY t.name`
  )
  return result
}

exports.getTeamById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT t.id, t.name, t.catalog_id, t.created_at, c.name AS catalog_name
     FROM teams t
     LEFT JOIN competency_catalogs c ON c.id = t.catalog_id
     WHERE t.id = $1`,
    [id]
  )
  return result
}

exports.createTeam = async (params) => {
  const { name } = params
  const result = await pool.query(
    'INSERT INTO teams (name) VALUES ($1) RETURNING id, name, created_at',
    [name]
  )
  return result
}

exports.updateTeam = async (params) => {
  const { id, name, catalog_id } = params
  const updates = []
  const values = []
  let paramIndex = 1

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(name)
  }

  if (catalog_id !== undefined) {
    updates.push(`catalog_id = $${paramIndex++}`)
    values.push(catalog_id)
  }

  if (!updates.length) {
    return exports.getTeamById({ id })
  }

  values.push(id)
  const result = await pool.query(
    `UPDATE teams
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}`,
    values
  )

  if (!result.rowCount) {
    return result
  }

  return exports.getTeamById({ id })
}

exports.deleteTeam = async (params) => {
  const { id } = params
  const result = await pool.query('DELETE FROM teams WHERE id = $1', [id])
  return result
}

exports.getTeamsByScope = async (actor) => {
  if (actor.role === 'admin') {
    return exports.getAllTeams()
  }

  if (actor.role === 'lead') {
    const managedTeamIds = Array.isArray(actor.managed_team_ids)
      ? actor.managed_team_ids
      : await getManagedTeamIds(actor.id)

    if (!managedTeamIds.length) {
      return { rows: [] }
    }

    const result = await pool.query(
      `SELECT t.id, t.name, t.catalog_id, t.created_at, c.name AS catalog_name
       FROM teams t
       LEFT JOIN competency_catalogs c ON c.id = t.catalog_id
       WHERE t.id = ANY($1::uuid[])
       ORDER BY t.name`,
      [managedTeamIds]
    )
    return result
  }

  return { rows: [] }
}

exports.isTeamNameTaken = async (params) => {
  const { name, excludeId } = params
  const result = await pool.query(
    'SELECT 1 FROM teams WHERE name = $1 AND ($2::uuid IS NULL OR id != $2)',
    [name, excludeId || null]
  )
  return result.rowCount > 0
}
