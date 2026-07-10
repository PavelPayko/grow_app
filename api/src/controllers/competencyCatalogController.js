const {
  cloneCatalog,
  getFullCatalogByTeamId,
  createCatalog,
  createBlock,
  updateBlock,
  deleteBlock,
  createDomain,
  updateDomain,
  deleteDomain,
  createCompetency,
  updateCompetency,
  deleteCompetency,
  upsertGradeTarget,
  deleteGradeTarget,
  getActiveCatalogByTeamId,
} = require('../services/competencyCatalogService')

const VALID_GRADES = ['junior', 'middle', 'senior']

function handleError(res, err) {
  if (err.code === 'SOURCE_CATALOG_NOT_FOUND') {
    return res.status(404).json({ error: err.message })
  }
  if (err.code === 'COMPETENCY_HAS_ASSESSMENTS') {
    return res.status(409).json({ error: err.message })
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Запись с такими параметрами уже существует' })
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Некорректные данные (проверьте вес и диапазоны)' })
  }
  return res.status(500).json({ error: err.message })
}

exports.getTeamCatalog = async (req, res) => {
  try {
    const { teamId } = req.params
    const data = await getFullCatalogByTeamId({ team_id: teamId })
    res.status(200).json(data)
  } catch (err) {
    handleError(res, err)
  }
}

exports.createTeamCatalog = async (req, res) => {
  const { teamId } = req.params
  const name = (req.body.name || '').trim()

  if (!name) {
    return res.status(400).json({ error: 'Название каталога обязательно' })
  }

  try {
    const existing = await getActiveCatalogByTeamId({ team_id: teamId })
    if (existing.rowCount) {
      return res.status(409).json({ error: 'У команды уже есть активный каталог' })
    }

    const result = await createCatalog({ team_id: teamId, name, is_active: true })
    res.status(201).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.cloneCatalog = async (req, res) => {
  const source_team_id = req.body.source_team_id
  const target_team_id = req.body.target_team_id
  const name = req.body.name

  if (!source_team_id || !target_team_id) {
    return res.status(400).json({
      error: 'Укажите source_team_id и target_team_id',
    })
  }

  if (source_team_id === target_team_id) {
    return res.status(400).json({
      error: 'Исходная и целевая команда должны отличаться',
    })
  }

  try {
    const result = await cloneCatalog({ source_team_id, target_team_id, name })
    res.status(201).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.createBlock = async (req, res) => {
  const { catalogId } = req.params
  const name = (req.body.name || '').trim()
  const sort_order = req.body.sort_order ?? 0

  if (!name) {
    return res.status(400).json({ error: 'Название блока обязательно' })
  }

  try {
    const result = await createBlock({ catalog_id: catalogId, name, sort_order })
    res.status(201).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateBlock = async (req, res) => {
  const { id } = req.params
  const name = (req.body.name || '').trim()
  const sort_order = req.body.sort_order ?? 0

  if (!name) {
    return res.status(400).json({ error: 'Название блока обязательно' })
  }

  try {
    const result = await updateBlock({ id, name, sort_order })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Блок не найден' })
    }
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteBlock = async (req, res) => {
  try {
    const result = await deleteBlock({ id: req.params.id })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Блок не найден' })
    }
    res.status(204).send()
  } catch (err) {
    handleError(res, err)
  }
}

exports.createDomain = async (req, res) => {
  const { blockId } = req.params
  const name = (req.body.name || '').trim()
  const sort_order = req.body.sort_order ?? 0

  if (!name) {
    return res.status(400).json({ error: 'Название домена обязательно' })
  }

  try {
    const result = await createDomain({ block_id: blockId, name, sort_order })
    res.status(201).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateDomain = async (req, res) => {
  const { id } = req.params
  const name = (req.body.name || '').trim()
  const sort_order = req.body.sort_order ?? 0

  if (!name) {
    return res.status(400).json({ error: 'Название домена обязательно' })
  }

  try {
    const result = await updateDomain({ id, name, sort_order })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Домен не найден' })
    }
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteDomain = async (req, res) => {
  try {
    const result = await deleteDomain({ id: req.params.id })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Домен не найден' })
    }
    res.status(204).send()
  } catch (err) {
    handleError(res, err)
  }
}

exports.createCompetency = async (req, res) => {
  const { domainId } = req.params
  const name = (req.body.name || '').trim()
  const weight = Number(req.body.weight)
  const level_criterion = (req.body.level_criterion || '').trim()
  const sort_order = req.body.sort_order ?? 0

  if (!name || !level_criterion) {
    return res.status(400).json({ error: 'Название и критерий обязательны' })
  }
  if (!weight || weight <= 0) {
    return res.status(400).json({ error: 'Вес должен быть больше 0' })
  }

  try {
    const result = await createCompetency({
      domain_id: domainId,
      name,
      weight,
      level_criterion,
      sort_order,
    })
    res.status(201).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.updateCompetency = async (req, res) => {
  const { id } = req.params
  const name = (req.body.name || '').trim()
  const weight = Number(req.body.weight)
  const level_criterion = (req.body.level_criterion || '').trim()
  const sort_order = req.body.sort_order ?? 0

  if (!name || !level_criterion) {
    return res.status(400).json({ error: 'Название и критерий обязательны' })
  }
  if (!weight || weight <= 0) {
    return res.status(400).json({ error: 'Вес должен быть больше 0' })
  }

  try {
    const result = await updateCompetency({
      id,
      name,
      weight,
      level_criterion,
      sort_order,
    })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Компетенция не найдена' })
    }
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteCompetency = async (req, res) => {
  try {
    const result = await deleteCompetency({ id: req.params.id })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Компетенция не найдена' })
    }
    res.status(204).send()
  } catch (err) {
    handleError(res, err)
  }
}

exports.upsertGradeTarget = async (req, res) => {
  const { blockId } = req.params
  const grade = req.body.grade
  const min_score = Number(req.body.min_score)
  const max_score = Number(req.body.max_score)

  if (!VALID_GRADES.includes(grade)) {
    return res.status(400).json({ error: 'Недопустимый грейд' })
  }
  if (Number.isNaN(min_score) || Number.isNaN(max_score) || min_score > max_score) {
    return res.status(400).json({ error: 'Некорректный диапазон min/max' })
  }

  try {
    const result = await upsertGradeTarget({
      block_id: blockId,
      grade,
      min_score,
      max_score,
    })
    res.status(200).json(result.rows[0])
  } catch (err) {
    handleError(res, err)
  }
}

exports.deleteGradeTarget = async (req, res) => {
  try {
    const result = await deleteGradeTarget({ id: req.params.id })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Target не найден' })
    }
    res.status(204).send()
  } catch (err) {
    handleError(res, err)
  }
}
