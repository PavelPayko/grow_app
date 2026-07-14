const pool = require('../config/db')
const { getCycleById, getUserGradeInCycle } = require('./assessmentCycleService')

function round(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }
  return Number(Number(value).toFixed(digits))
}

function getTargetStatus(weightedTotal, minScore, maxScore) {
  if (weightedTotal === null) {
    return null
  }
  if (weightedTotal < minScore) {
    return 'below'
  }
  if (weightedTotal > maxScore) {
    return 'above'
  }
  return 'in_range'
}

function buildAggregateFromRows(rows, gradeTargetsByBlock) {
  let weightedSum = 0
  let weightScored = 0
  let scoreSum = 0
  let scoredCount = 0
  let totalCount = 0

  const blocksMap = new Map()

  for (const row of rows) {
    totalCount += 1

    if (!blocksMap.has(row.block_id)) {
      blocksMap.set(row.block_id, {
        block_id: row.block_id,
        block_name: row.block_name,
        block_sort_order: row.block_sort_order,
        weighted_sum: 0,
        weight_scored: 0,
        score_sum: 0,
        scored_count: 0,
        total_count: 0,
      })
    }

    const block = blocksMap.get(row.block_id)
    block.total_count += 1

    if (row.score !== null && row.score !== undefined) {
      const weight = Number(row.weight)
      const score = Number(row.score)

      weightedSum += weight * score
      weightScored += weight
      scoreSum += score
      scoredCount += 1

      block.weighted_sum += weight * score
      block.weight_scored += weight
      block.score_sum += score
      block.scored_count += 1
    }
  }

  const weightedTotal = weightScored > 0 ? weightedSum / weightScored : null
  const unweightedAvg = scoredCount > 0 ? scoreSum / scoredCount : null
  const fillRate = totalCount > 0 ? scoredCount / totalCount : 0

  const blocks = [...blocksMap.values()]
    .sort((a, b) => a.block_sort_order - b.block_sort_order)
    .map((block) => {
      const blockWeightedTotal =
        block.weight_scored > 0 ? block.weighted_sum / block.weight_scored : null
      const blockUnweightedAvg =
        block.scored_count > 0 ? block.score_sum / block.scored_count : null
      const targets = gradeTargetsByBlock.get(block.block_id) || {}
      const targetForGrade = targets.grade_target || null

      return {
        block_id: block.block_id,
        block_name: block.block_name,
        weighted_sum: round(block.weighted_sum),
        weight_scored: round(block.weight_scored),
        weighted_total: round(blockWeightedTotal),
        unweighted_avg: round(blockUnweightedAvg),
        scored_count: block.scored_count,
        total_count: block.total_count,
        fill_rate: round(block.total_count > 0 ? block.scored_count / block.total_count : 0),
        target: targetForGrade
          ? {
              grade: targets.grade,
              min_score: targetForGrade.min_score,
              max_score: targetForGrade.max_score,
              status: getTargetStatus(
                blockWeightedTotal,
                Number(targetForGrade.min_score),
                Number(targetForGrade.max_score)
              ),
            }
          : null,
      }
    })

  return {
    weighted_sum: round(weightedSum),
    weight_scored: round(weightScored),
    weighted_total: round(weightedTotal),
    unweighted_avg: round(unweightedAvg),
    scored_count: scoredCount,
    total_count: totalCount,
    fill_rate: round(fillRate),
    blocks,
  }
}

async function fetchCompetencyScoreRows(cycle_id, user_id, catalog_id) {
  const result = await pool.query(
    `SELECT
       b.id AS block_id,
       b.name AS block_name,
       b.sort_order AS block_sort_order,
       c.id AS competency_id,
       c.weight,
       a.score
     FROM competency_blocks b
     JOIN competency_domains d ON d.block_id = b.id
     JOIN competencies c ON c.domain_id = d.id
     LEFT JOIN competency_assessments a
       ON a.competency_id = c.id
      AND a.cycle_id = $1
      AND a.user_id = $2
     WHERE b.catalog_id = $3
     ORDER BY b.sort_order, d.sort_order, c.sort_order`,
    [cycle_id, user_id, catalog_id]
  )
  return result.rows
}

async function fetchGradeTargetsByBlock(catalog_id, grade) {
  const result = await pool.query(
    `SELECT gt.block_id, gt.grade, gt.min_score, gt.max_score
     FROM grade_targets gt
     JOIN competency_blocks b ON b.id = gt.block_id
     WHERE b.catalog_id = $1 AND gt.grade = $2`,
    [catalog_id, grade]
  )

  const map = new Map()
  for (const row of result.rows) {
    map.set(row.block_id, {
      grade: row.grade,
      grade_target: {
        min_score: row.min_score,
        max_score: row.max_score,
      },
    })
  }
  return map
}

async function resolveUserGrade(cycle_id, user_id) {
  const snapshot = await getUserGradeInCycle({ cycle_id, user_id })
  if (snapshot.rowCount) {
    return snapshot.rows[0].grade
  }

  const userResult = await pool.query('SELECT grade FROM users WHERE id = $1', [user_id])
  return userResult.rows[0]?.grade ?? null
}

exports.getTargetStatus = getTargetStatus

exports.calculateUserAggregates = async (params) => {
  const { cycle_id, user_id } = params

  const cycleResult = await getCycleById({ id: cycle_id })
  if (!cycleResult.rowCount) {
    const error = new Error('Цикл оценки не найден')
    error.code = 'CYCLE_NOT_FOUND'
    throw error
  }

  const cycle = cycleResult.rows[0]
  const grade = await resolveUserGrade(cycle_id, user_id)
  const rows = await fetchCompetencyScoreRows(cycle_id, user_id, cycle.catalog_id)
  const gradeTargetsByBlock = grade
    ? await fetchGradeTargetsByBlock(cycle.catalog_id, grade)
    : new Map()
  const aggregates = buildAggregateFromRows(rows, gradeTargetsByBlock)

  return {
    cycle_id,
    user_id,
    grade,
    ...aggregates,
  }
}

exports.calculateTeamAggregates = async (params) => {
  const { cycle_id } = params

  const cycleResult = await getCycleById({ id: cycle_id })
  if (!cycleResult.rowCount) {
    const error = new Error('Цикл оценки не найден')
    error.code = 'CYCLE_NOT_FOUND'
    throw error
  }

  const cycle = cycleResult.rows[0]
  const usersResult = await pool.query(
    `SELECT id, full_name FROM users WHERE team_id = $1 ORDER BY full_name`,
    [cycle.team_id]
  )

  const results = []
  for (const user of usersResult.rows) {
    const userAggregates = await exports.calculateUserAggregates({
      cycle_id,
      user_id: user.id,
    })
    results.push({
      user_id: user.id,
      full_name: user.full_name,
      grade: userAggregates.grade,
      weighted_total: userAggregates.weighted_total,
      unweighted_avg: userAggregates.unweighted_avg,
      fill_rate: userAggregates.fill_rate,
      scored_count: userAggregates.scored_count,
      total_count: userAggregates.total_count,
      blocks: userAggregates.blocks,
    })
  }

  return results
}

exports.calculateBlockAggregates = async (params) => {
  const { cycle_id, user_id, block_id } = params
  const userAggregates = await exports.calculateUserAggregates({ cycle_id, user_id })
  const block = userAggregates.blocks.find((item) => item.block_id === block_id)

  if (!block) {
    const error = new Error('Блок не найден в каталоге цикла')
    error.code = 'BLOCK_NOT_FOUND'
    throw error
  }

  return block
}
