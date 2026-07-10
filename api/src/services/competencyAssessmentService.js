const pool = require('../config/db')

function validateScore(score) {
  if (score === null || score === undefined) {
    return null
  }
  const value = Number(score)
  if (!Number.isInteger(value) || value < 0 || value > 3) {
    const error = new Error('Балл должен быть целым числом от 0 до 3')
    error.code = 'INVALID_SCORE'
    throw error
  }
  return value
}

async function assertCycleWritable(client, cycle_id) {
  const result = await client.query(
    `SELECT id, status, catalog_id, team_id FROM assessment_cycles WHERE id = $1`,
    [cycle_id]
  )

  if (!result.rowCount) {
    const error = new Error('Цикл оценки не найден')
    error.code = 'CYCLE_NOT_FOUND'
    throw error
  }

  const cycle = result.rows[0]

  if (cycle.status !== 'active') {
    const error = new Error('Оценки можно изменять только в активном цикле')
    error.code = 'CYCLE_NOT_WRITABLE'
    throw error
  }

  return cycle
}

async function assertCompetencyInCatalog(client, competency_id, catalog_id) {
  const result = await client.query(
    `SELECT c.id
     FROM competencies c
     JOIN competency_domains d ON d.id = c.domain_id
     JOIN competency_blocks b ON b.id = d.block_id
     WHERE c.id = $1 AND b.catalog_id = $2`,
    [competency_id, catalog_id]
  )

  if (!result.rowCount) {
    const error = new Error('Компетенция не входит в каталог цикла')
    error.code = 'COMPETENCY_NOT_IN_CATALOG'
    throw error
  }
}

exports.getAssessmentsByCycleAndUser = async (params) => {
  const { cycle_id, user_id } = params
  const result = await pool.query(
    `SELECT id, cycle_id, user_id, competency_id, score, evidence,
            assessed_by, assessed_at, created_at
     FROM competency_assessments
     WHERE cycle_id = $1 AND user_id = $2
     ORDER BY created_at`,
    [cycle_id, user_id]
  )
  return result
}

exports.getAssessmentsByCycleId = async (params) => {
  const { cycle_id } = params
  const result = await pool.query(
    `SELECT id, cycle_id, user_id, competency_id, score, evidence,
            assessed_by, assessed_at, created_at
     FROM competency_assessments
     WHERE cycle_id = $1`,
    [cycle_id]
  )
  return result
}

exports.getAssessment = async (params) => {
  const { cycle_id, user_id, competency_id } = params
  const result = await pool.query(
    `SELECT id, cycle_id, user_id, competency_id, score, evidence,
            assessed_by, assessed_at, created_at
     FROM competency_assessments
     WHERE cycle_id = $1 AND user_id = $2 AND competency_id = $3`,
    [cycle_id, user_id, competency_id]
  )
  return result
}

exports.upsertAssessment = async (params) => {
  const { cycle_id, user_id, competency_id, score, evidence, assessed_by } = params
  const validatedScore = validateScore(score)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const cycle = await assertCycleWritable(client, cycle_id)
    await assertCompetencyInCatalog(client, competency_id, cycle.catalog_id)

    const userResult = await client.query(
      'SELECT id FROM users WHERE id = $1 AND team_id = $2',
      [user_id, cycle.team_id]
    )

    if (!userResult.rowCount) {
      const error = new Error('Пользователь не принадлежит команде цикла')
      error.code = 'USER_NOT_IN_TEAM'
      throw error
    }

    const result = await client.query(
      `INSERT INTO competency_assessments
         (cycle_id, user_id, competency_id, score, evidence, assessed_by, assessed_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (cycle_id, user_id, competency_id)
       DO UPDATE SET
         score = EXCLUDED.score,
         evidence = EXCLUDED.evidence,
         assessed_by = EXCLUDED.assessed_by,
         assessed_at = now()
       RETURNING id, cycle_id, user_id, competency_id, score, evidence,
                 assessed_by, assessed_at, created_at`,
      [
        cycle_id,
        user_id,
        competency_id,
        validatedScore,
        evidence || null,
        assessed_by,
      ]
    )

    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

exports.validateScore = validateScore
