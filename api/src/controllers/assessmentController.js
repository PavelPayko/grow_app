const {
  getCyclesByTeamId,
  getCycleById,
  getActiveCycleByTeamId,
  createCycle,
  activateCycle,
  closeCycle,
  validateCatalogForTeam,
} = require('../services/assessmentCycleService')
const {
  getAssessmentsByCycleAndUser,
  upsertAssessment,
} = require('../services/competencyAssessmentService')
const {
  calculateUserAggregates,
  calculateTeamAggregates,
} = require('../services/assessmentAggregateService')
const { getFullCatalogByCatalogId } = require('../services/competencyCatalogService')
const { canViewAssessment } = require('../middleware/canAssess')

function canViewUser(req, userId) {
  return canViewAssessment(req.user, userId)
}

function handleError(res, err) {
  const statusMap = {
    CYCLE_NOT_FOUND: 404,
    CYCLE_INVALID_STATUS: 400,
    CYCLE_ALREADY_ACTIVE: 409,
    CYCLE_ALREADY_CLOSED: 409,
    CYCLE_NOT_WRITABLE: 403,
    INVALID_SCORE: 400,
    COMPETENCY_NOT_IN_CATALOG: 400,
    USER_NOT_IN_TEAM: 400,
    BLOCK_NOT_FOUND: 404,
  }

  const status = statusMap[err.code] || 500
  return res.status(status).json({ error: err.message })
}

exports.getTeamCycles = async (req, res) => {
  try {
    const result = await getCyclesByTeamId({ team_id: req.params.teamId })
    res.status(200).json(result.rows)
  } catch (err) {
    handleError(res, err)
  }
}

exports.getActiveTeamCycle = async (req, res) => {
  try {
    const result = await getActiveCycleByTeamId({ team_id: req.params.teamId })
    if (!result.rowCount) {
      return res.status(200).json(null)
    }
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.createTeamCycle = async (req, res) => {
  const { teamId } = req.params
  const name = (req.body.name || '').trim()
  const catalog_id = req.body.catalog_id
  const start_date = req.body.start_date || null
  const end_date = req.body.end_date || null

  if (!name || !catalog_id) {
    return res.status(400).json({ error: 'Укажите name и catalog_id' })
  }

  try {
    const isValid = await validateCatalogForTeam({ team_id: teamId, catalog_id })
    if (!isValid) {
      return res.status(400).json({ error: 'Каталог не принадлежит команде или не активен' })
    }

    const result = await createCycle({
      team_id: teamId,
      catalog_id,
      name,
      start_date,
      end_date,
    })
    res.status(201).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.getCycle = async (req, res) => {
  try {
    const result = await getCycleById({ id: req.params.cycleId })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Цикл не найден' })
    }
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.activateCycle = async (req, res) => {
  try {
    const result = await activateCycle({ id: req.params.cycleId })
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.closeCycle = async (req, res) => {
  try {
    const result = await closeCycle({ id: req.params.cycleId })
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.getUserAssessments = async (req, res) => {
  const { cycleId, userId } = req.params

  if (!canViewUser(req, userId)) {
    return res.status(403).json({ error: 'Нет доступа к оценкам пользователя' })
  }

  try {
    const result = await getAssessmentsByCycleAndUser({ cycle_id: cycleId, user_id: userId })
    res.status(200).json(result.rows)
  } catch (err) {
    handleError(res, err)
  }
}

exports.upsertUserAssessment = async (req, res) => {
  const { cycleId, userId, competencyId } = req.params

  try {
    const result = await upsertAssessment({
      cycle_id: cycleId,
      user_id: userId,
      competency_id: competencyId,
      score: req.body.score,
      evidence: req.body.evidence,
      assessed_by: req.user.id,
    })
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.getUserAggregates = async (req, res) => {
  const { cycleId, userId } = req.params

  if (!canViewUser(req, userId)) {
    return res.status(403).json({ error: 'Нет доступа к итогам пользователя' })
  }

  try {
    const result = await calculateUserAggregates({ cycle_id: cycleId, user_id: userId })
    res.status(200).json(result)
  } catch (err) {
    handleError(res, err)
  }
}

exports.getTeamAggregates = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Нет доступа к итогам команды' })
  }

  try {
    const result = await calculateTeamAggregates({ cycle_id: req.params.cycleId })
    res.status(200).json(result)
  } catch (err) {
    handleError(res, err)
  }
}

exports.getUserMatrix = async (req, res) => {
  const { cycleId, userId } = req.params

  if (!canViewUser(req, userId)) {
    return res.status(403).json({ error: 'Нет доступа к матрице пользователя' })
  }

  try {
    const cycleResult = await getCycleById({ id: cycleId })
    if (!cycleResult.rowCount) {
      return res.status(404).json({ error: 'Цикл не найден' })
    }

    const cycle = cycleResult.rows[0]
    const [catalog, assessments, aggregates] = await Promise.all([
      getFullCatalogByCatalogId({ catalog_id: cycle.catalog_id }),
      getAssessmentsByCycleAndUser({ cycle_id: cycleId, user_id: userId }),
      calculateUserAggregates({ cycle_id: cycleId, user_id: userId }),
    ])

    const assessmentMap = new Map(
      assessments.rows.map((item) => [item.competency_id, item])
    )

    const blocks = catalog.blocks.map((block) => ({
      ...block,
      domains: block.domains.map((domain) => ({
        ...domain,
        competencies: domain.competencies.map((competency) => ({
          ...competency,
          assessment: assessmentMap.get(competency.id) || null,
        })),
      })),
    }))

    res.status(200).json({
      cycle,
      catalog: catalog.catalog,
      blocks,
      aggregates,
    })
  } catch (err) {
    handleError(res, err)
  }
}
