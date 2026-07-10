const pool = require('../config/db')

exports.getAllTeams = async () => {
  const result = await pool.query(
    'SELECT id, name, created_at FROM teams ORDER BY name'
  )
  return result
}

exports.getTeamById = async (params) => {
  const { id } = params
  const result = await pool.query(
    'SELECT id, name, created_at FROM teams WHERE id = $1',
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
  const { id, name } = params
  const result = await pool.query(
    'UPDATE teams SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
    [name, id]
  )
  return result
}

exports.deleteTeam = async (params) => {
  const { id } = params
  const result = await pool.query('DELETE FROM teams WHERE id = $1', [id])
  return result
}

exports.isTeamNameTaken = async (params) => {
  const { name, excludeId } = params
  const result = await pool.query(
    'SELECT 1 FROM teams WHERE name = $1 AND ($2::uuid IS NULL OR id != $2)',
    [name, excludeId || null]
  )
  return result.rowCount > 0
}
