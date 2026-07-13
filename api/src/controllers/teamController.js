const {
  getAllTeams,
  createTeam,
  updateTeam,
  isTeamNameTaken,
} = require('../services/teamService')
const { getCatalogById } = require('../services/competencyCatalogService')

exports.getTeams = async (req, res) => {
  try {
    const result = await getAllTeams()
    res.status(200).json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.createTeam = async (req, res) => {
  const name = (req.body.name || '').trim()

  if (!name) {
    return res.status(400).json({ error: 'Название команды обязательно' })
  }

  try {
    const nameTaken = await isTeamNameTaken({ name })

    if (nameTaken) {
      return res.status(409).json({ error: 'Команда с таким названием уже существует' })
    }

    const result = await createTeam({ name })
    res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Команда с таким названием уже существует' })
    }
    res.status(500).json({ error: err.message })
  }
}

exports.updateTeam = async (req, res) => {
  const { teamId } = req.params
  const hasName = Object.prototype.hasOwnProperty.call(req.body, 'name')
  const hasCatalogId = Object.prototype.hasOwnProperty.call(req.body, 'catalog_id')
  const name = hasName ? String(req.body.name).trim() : undefined
  const catalog_id = hasCatalogId ? req.body.catalog_id : undefined

  if (!hasName && !hasCatalogId) {
    return res.status(400).json({ error: 'Укажите name или catalog_id' })
  }

  if (hasName && !name) {
    return res.status(400).json({ error: 'Название команды обязательно' })
  }

  try {
    if (hasName) {
      const nameTaken = await isTeamNameTaken({ name, excludeId: teamId })
      if (nameTaken) {
        return res.status(409).json({ error: 'Команда с таким названием уже существует' })
      }
    }

    if (hasCatalogId && catalog_id !== null) {
      const catalog = await getCatalogById({ id: catalog_id })
      if (!catalog.rowCount) {
        return res.status(400).json({ error: 'Каталог не найден' })
      }
    }

    const result = await updateTeam({ id: teamId, name, catalog_id })
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Команда не найдена' })
    }

    res.status(200).json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Команда с таким названием уже существует' })
    }
    res.status(500).json({ error: err.message })
  }
}
