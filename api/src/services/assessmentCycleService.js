const pool = require('../config/db')

exports.getCyclesByTeamId = async (params) => {
  const { team_id } = params
  const result = await pool.query(
    `SELECT id, team_id, catalog_id, name, start_date, end_date, status, created_at
     FROM assessment_cycles
     WHERE team_id = $1
     ORDER BY created_at DESC`,
    [team_id]
  )
  return result
}

exports.getActiveCycleByTeamId = async (params) => {
  const { team_id } = params
  const result = await pool.query(
    `SELECT id, team_id, catalog_id, name, start_date, end_date, status, created_at
     FROM assessment_cycles
     WHERE team_id = $1 AND status = 'active'
     LIMIT 1`,
    [team_id]
  )
  return result
}

exports.getCycleById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT id, team_id, catalog_id, name, start_date, end_date, status, created_at
     FROM assessment_cycles
     WHERE id = $1`,
    [id]
  )
  return result
}

exports.createCycle = async (params) => {
  const { team_id, catalog_id, name, start_date, end_date } = params
  const result = await pool.query(
    `INSERT INTO assessment_cycles (team_id, catalog_id, name, start_date, end_date, status)
     VALUES ($1, $2, $3, $4, $5, 'draft')
     RETURNING id, team_id, catalog_id, name, start_date, end_date, status, created_at`,
    [team_id, catalog_id, name, start_date || null, end_date || null]
  )
  return result
}

async function createGradeSnapshots(client, cycle_id, team_id) {
  await client.query(
    `INSERT INTO cycle_user_snapshots (cycle_id, user_id, grade)
     SELECT $1, id, grade
     FROM users
     WHERE team_id = $2
     ON CONFLICT (cycle_id, user_id)
     DO UPDATE SET grade = EXCLUDED.grade, created_at = now()`,
    [cycle_id, team_id]
  )
}

exports.getGradeSnapshotsByCycleId = async (params) => {
  const { cycle_id } = params
  const result = await pool.query(
    `SELECT cycle_id, user_id, grade, created_at
     FROM cycle_user_snapshots
     WHERE cycle_id = $1`,
    [cycle_id]
  )
  return result
}

exports.getUserGradeInCycle = async (params) => {
  const { cycle_id, user_id } = params
  const result = await pool.query(
    `SELECT grade FROM cycle_user_snapshots
     WHERE cycle_id = $1 AND user_id = $2`,
    [cycle_id, user_id]
  )
  return result
}

exports.activateCycle = async (params) => {
  const { id } = params
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const cycleResult = await client.query(
      `SELECT id, team_id, status FROM assessment_cycles WHERE id = $1 FOR UPDATE`,
      [id]
    )

    if (!cycleResult.rowCount) {
      const error = new Error('Цикл оценки не найден')
      error.code = 'CYCLE_NOT_FOUND'
      throw error
    }

    const cycle = cycleResult.rows[0]

    if (cycle.status === 'closed') {
      const error = new Error('Нельзя активировать закрытый цикл')
      error.code = 'CYCLE_INVALID_STATUS'
      throw error
    }

    if (cycle.status === 'active') {
      const error = new Error('Цикл уже активен')
      error.code = 'CYCLE_ALREADY_ACTIVE'
      throw error
    }

    await client.query(
      `UPDATE assessment_cycles SET status = 'closed'
       WHERE team_id = $1 AND status = 'active'`,
      [cycle.team_id]
    )

    const updatedResult = await client.query(
      `UPDATE assessment_cycles SET status = 'active'
       WHERE id = $1
       RETURNING id, team_id, catalog_id, name, start_date, end_date, status, created_at`,
      [id]
    )

    await createGradeSnapshots(client, id, cycle.team_id)

    await client.query('COMMIT')
    return updatedResult
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

exports.closeCycle = async (params) => {
  const { id } = params
  const cycleResult = await exports.getCycleById({ id })

  if (!cycleResult.rowCount) {
    const error = new Error('Цикл оценки не найден')
    error.code = 'CYCLE_NOT_FOUND'
    throw error
  }

  if (cycleResult.rows[0].status === 'closed') {
    const error = new Error('Цикл уже закрыт')
    error.code = 'CYCLE_ALREADY_CLOSED'
    throw error
  }

  const result = await pool.query(
    `UPDATE assessment_cycles SET status = 'closed'
     WHERE id = $1
     RETURNING id, team_id, catalog_id, name, start_date, end_date, status, created_at`,
    [id]
  )
  return result
}

exports.validateCatalogForTeam = async (params) => {
  const { team_id, catalog_id } = params
  const result = await pool.query(
    `SELECT id FROM competency_catalogs
     WHERE id = $1 AND team_id = $2 AND is_active = true`,
    [catalog_id, team_id]
  )
  return result.rowCount > 0
}
