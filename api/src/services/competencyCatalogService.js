const pool = require('../config/db')

const CYCLE_STATUS_LABELS = {
  draft: 'черновик',
  active: 'активный',
  closed: 'закрыт',
}

const DELETE_BLOCKERS_LIMIT = 5

function formatExtraCount(total) {
  if (total <= DELETE_BLOCKERS_LIMIT) {
    return ''
  }
  return ` и ещё ${total - DELETE_BLOCKERS_LIMIT}`
}

function formatLinkedTeamNames(rows, total) {
  const names = rows.map((row) => row.name).join(', ')
  return `${names}${formatExtraCount(total)}`
}

function formatLinkedCycles(rows, total) {
  const items = rows
    .map((row) => {
      const status = CYCLE_STATUS_LABELS[row.status] || row.status
      return `«${row.name}» (${row.team_name}, ${status})`
    })
    .join(', ')
  return `${items}${formatExtraCount(total)}`
}

// --- Catalogs ---

exports.getAllCatalogs = async () => {
  const result = await pool.query(
    `SELECT id, name, created_at
     FROM competency_catalogs
     ORDER BY name`
  )
  return result
}

exports.getCatalogById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT id, name, created_at
     FROM competency_catalogs
     WHERE id = $1`,
    [id]
  )
  return result
}

exports.createCatalog = async (params) => {
  const { name } = params
  const result = await pool.query(
    `INSERT INTO competency_catalogs (name)
     VALUES ($1)
     RETURNING id, name, created_at`,
    [name]
  )
  return result
}

exports.updateCatalog = async (params) => {
  const { id, name } = params
  const result = await pool.query(
    `UPDATE competency_catalogs
     SET name = $1
     WHERE id = $2
     RETURNING id, name, created_at`,
    [name, id]
  )
  return result
}

exports.deleteCatalog = async (params) => {
  const { id } = params

  const catalog = await exports.getCatalogById({ id })
  if (!catalog.rowCount) {
    const error = new Error('Каталог не найден')
    error.code = 'CATALOG_NOT_FOUND'
    throw error
  }

  const linkedTeams = await pool.query(
    `SELECT name
     FROM teams
     WHERE catalog_id = $1
     ORDER BY name`,
    [id]
  )
  if (linkedTeams.rowCount) {
    const preview = linkedTeams.rows.slice(0, DELETE_BLOCKERS_LIMIT)
    const error = new Error(
      `Нельзя удалить каталог: привязан к командам — ${formatLinkedTeamNames(preview, linkedTeams.rowCount)}`
    )
    error.code = 'CATALOG_LINKED_TO_TEAMS'
    throw error
  }

  const linkedCycles = await pool.query(
    `SELECT ac.name, ac.status, t.name AS team_name
     FROM assessment_cycles ac
     JOIN teams t ON t.id = ac.team_id
     WHERE ac.catalog_id = $1
     ORDER BY ac.created_at DESC`,
    [id]
  )
  if (linkedCycles.rowCount) {
    const preview = linkedCycles.rows.slice(0, DELETE_BLOCKERS_LIMIT)
    const error = new Error(
      `Нельзя удалить каталог: используется в циклах — ${formatLinkedCycles(preview, linkedCycles.rowCount)}`
    )
    error.code = 'CATALOG_USED_IN_CYCLES'
    throw error
  }

  const result = await pool.query('DELETE FROM competency_catalogs WHERE id = $1', [id])
  return result
}

// --- Blocks ---

exports.getBlocksByCatalogId = async (params) => {
  const { catalog_id } = params
  const result = await pool.query(
    `SELECT id, catalog_id, name, sort_order, created_at
     FROM competency_blocks
     WHERE catalog_id = $1
     ORDER BY sort_order, name`,
    [catalog_id]
  )
  return result
}

exports.getBlockById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT id, catalog_id, name, sort_order, created_at
     FROM competency_blocks
     WHERE id = $1`,
    [id]
  )
  return result
}

exports.createBlock = async (params) => {
  const { catalog_id, name, sort_order = 0 } = params
  const result = await pool.query(
    `INSERT INTO competency_blocks (catalog_id, name, sort_order)
     VALUES ($1, $2, $3)
     RETURNING id, catalog_id, name, sort_order, created_at`,
    [catalog_id, name, sort_order]
  )
  return result
}

exports.updateBlock = async (params) => {
  const { id, name, sort_order } = params
  const result = await pool.query(
    `UPDATE competency_blocks
     SET name = $1, sort_order = $2
     WHERE id = $3
     RETURNING id, catalog_id, name, sort_order, created_at`,
    [name, sort_order, id]
  )
  return result
}

exports.deleteBlock = async (params) => {
  const { id } = params
  const result = await pool.query('DELETE FROM competency_blocks WHERE id = $1', [id])
  return result
}

// --- Domains ---

exports.getDomainsByBlockId = async (params) => {
  const { block_id } = params
  const result = await pool.query(
    `SELECT id, block_id, name, sort_order, created_at
     FROM competency_domains
     WHERE block_id = $1
     ORDER BY sort_order, name`,
    [block_id]
  )
  return result
}

exports.getDomainById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT id, block_id, name, sort_order, created_at
     FROM competency_domains
     WHERE id = $1`,
    [id]
  )
  return result
}

exports.createDomain = async (params) => {
  const { block_id, name, sort_order = 0 } = params
  const result = await pool.query(
    `INSERT INTO competency_domains (block_id, name, sort_order)
     VALUES ($1, $2, $3)
     RETURNING id, block_id, name, sort_order, created_at`,
    [block_id, name, sort_order]
  )
  return result
}

exports.updateDomain = async (params) => {
  const { id, name, sort_order } = params
  const result = await pool.query(
    `UPDATE competency_domains
     SET name = $1, sort_order = $2
     WHERE id = $3
     RETURNING id, block_id, name, sort_order, created_at`,
    [name, sort_order, id]
  )
  return result
}

exports.deleteDomain = async (params) => {
  const { id } = params
  const result = await pool.query('DELETE FROM competency_domains WHERE id = $1', [id])
  return result
}

// --- Competencies ---

exports.getCompetenciesByDomainId = async (params) => {
  const { domain_id } = params
  const result = await pool.query(
    `SELECT id, domain_id, name, weight, level_criterion, sort_order, created_at
     FROM competencies
     WHERE domain_id = $1
     ORDER BY sort_order, name`,
    [domain_id]
  )
  return result
}

exports.getCompetencyById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT id, domain_id, name, weight, level_criterion, sort_order, created_at
     FROM competencies
     WHERE id = $1`,
    [id]
  )
  return result
}

exports.hasCompetencyAssessments = async (params) => {
  const { competency_id } = params
  const result = await pool.query(
    'SELECT 1 FROM competency_assessments WHERE competency_id = $1 LIMIT 1',
    [competency_id]
  )
  return result.rowCount > 0
}

exports.createCompetency = async (params) => {
  const { domain_id, name, weight, level_criterion, sort_order = 0 } = params
  const result = await pool.query(
    `INSERT INTO competencies (domain_id, name, weight, level_criterion, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, domain_id, name, weight, level_criterion, sort_order, created_at`,
    [domain_id, name, weight, level_criterion, sort_order]
  )
  return result
}

exports.updateCompetency = async (params) => {
  const { id, name, weight, level_criterion, sort_order } = params
  const result = await pool.query(
    `UPDATE competencies
     SET name = $1, weight = $2, level_criterion = $3, sort_order = $4
     WHERE id = $5
     RETURNING id, domain_id, name, weight, level_criterion, sort_order, created_at`,
    [name, weight, level_criterion, sort_order, id]
  )
  return result
}

exports.deleteCompetency = async (params) => {
  const { id } = params
  const hasAssessments = await exports.hasCompetencyAssessments({ competency_id: id })

  if (hasAssessments) {
    const error = new Error('Нельзя удалить компетенцию с существующими оценками')
    error.code = 'COMPETENCY_HAS_ASSESSMENTS'
    throw error
  }

  const result = await pool.query('DELETE FROM competencies WHERE id = $1', [id])
  return result
}

// --- Grade targets ---

exports.getGradeTargetsByBlockId = async (params) => {
  const { block_id } = params
  const result = await pool.query(
    `SELECT id, block_id, grade, min_score, max_score, created_at
     FROM grade_targets
     WHERE block_id = $1
     ORDER BY grade`,
    [block_id]
  )
  return result
}

exports.getGradeTargetById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT id, block_id, grade, min_score, max_score, created_at
     FROM grade_targets
     WHERE id = $1`,
    [id]
  )
  return result
}

exports.upsertGradeTarget = async (params) => {
  const { block_id, grade, min_score, max_score } = params
  const result = await pool.query(
    `INSERT INTO grade_targets (block_id, grade, min_score, max_score)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (block_id, grade)
     DO UPDATE SET min_score = EXCLUDED.min_score, max_score = EXCLUDED.max_score
     RETURNING id, block_id, grade, min_score, max_score, created_at`,
    [block_id, grade, min_score, max_score]
  )
  return result
}

exports.updateGradeTarget = async (params) => {
  const { id, min_score, max_score } = params
  const result = await pool.query(
    `UPDATE grade_targets
     SET min_score = $1, max_score = $2
     WHERE id = $3
     RETURNING id, block_id, grade, min_score, max_score, created_at`,
    [min_score, max_score, id]
  )
  return result
}

exports.deleteGradeTarget = async (params) => {
  const { id } = params
  const result = await pool.query('DELETE FROM grade_targets WHERE id = $1', [id])
  return result
}

// --- Full catalog tree ---

exports.getFullCatalogByTeamId = async (params) => {
  const { team_id } = params
  const teamResult = await pool.query(
    `SELECT catalog_id FROM teams WHERE id = $1`,
    [team_id]
  )

  if (!teamResult.rowCount || !teamResult.rows[0].catalog_id) {
    return { catalog: null, blocks: [] }
  }

  return exports.getFullCatalogByCatalogId({
    catalog_id: teamResult.rows[0].catalog_id,
  })
}

exports.getFullCatalogByCatalogId = async (params) => {
  const { catalog_id } = params
  const catalogResult = await exports.getCatalogById({ id: catalog_id })

  if (!catalogResult.rowCount) {
    return { catalog: null, blocks: [] }
  }

  const catalog = catalogResult.rows[0]
  const blocksResult = await exports.getBlocksByCatalogId({ catalog_id: catalog.id })
  const blocks = []

  for (const block of blocksResult.rows) {
    const domainsResult = await exports.getDomainsByBlockId({ block_id: block.id })
    const gradeTargetsResult = await exports.getGradeTargetsByBlockId({ block_id: block.id })
    const domains = []

    for (const domain of domainsResult.rows) {
      const competenciesResult = await exports.getCompetenciesByDomainId({ domain_id: domain.id })
      domains.push({
        ...domain,
        competencies: competenciesResult.rows,
      })
    }

    blocks.push({
      ...block,
      grade_targets: gradeTargetsResult.rows,
      domains,
    })
  }

  return { catalog, blocks }
}

exports.cloneCatalogById = async (params) => {
  const { source_catalog_id, name } = params
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const sourceCatalogResult = await client.query(
      `SELECT id, name FROM competency_catalogs WHERE id = $1`,
      [source_catalog_id]
    )

    if (!sourceCatalogResult.rowCount) {
      const error = new Error('Исходный каталог не найден')
      error.code = 'SOURCE_CATALOG_NOT_FOUND'
      throw error
    }

    const sourceCatalog = sourceCatalogResult.rows[0]
    const catalogName = name || `${sourceCatalog.name} (копия)`

    const newCatalogResult = await client.query(
      `INSERT INTO competency_catalogs (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [catalogName]
    )
    const newCatalog = newCatalogResult.rows[0]

    const blocksResult = await client.query(
      `SELECT id, name, sort_order FROM competency_blocks
       WHERE catalog_id = $1 ORDER BY sort_order`,
      [sourceCatalog.id]
    )

    for (const block of blocksResult.rows) {
      const newBlockResult = await client.query(
        `INSERT INTO competency_blocks (catalog_id, name, sort_order)
         VALUES ($1, $2, $3) RETURNING id`,
        [newCatalog.id, block.name, block.sort_order]
      )
      const newBlockId = newBlockResult.rows[0].id

      const gradeTargetsResult = await client.query(
        `SELECT grade, min_score, max_score FROM grade_targets WHERE block_id = $1`,
        [block.id]
      )

      for (const target of gradeTargetsResult.rows) {
        await client.query(
          `INSERT INTO grade_targets (block_id, grade, min_score, max_score)
           VALUES ($1, $2, $3, $4)`,
          [newBlockId, target.grade, target.min_score, target.max_score]
        )
      }

      const domainsResult = await client.query(
        `SELECT id, name, sort_order FROM competency_domains
         WHERE block_id = $1 ORDER BY sort_order`,
        [block.id]
      )

      for (const domain of domainsResult.rows) {
        const newDomainResult = await client.query(
          `INSERT INTO competency_domains (block_id, name, sort_order)
           VALUES ($1, $2, $3) RETURNING id`,
          [newBlockId, domain.name, domain.sort_order]
        )
        const newDomainId = newDomainResult.rows[0].id

        const competenciesResult = await client.query(
          `SELECT name, weight, level_criterion, sort_order FROM competencies
           WHERE domain_id = $1 ORDER BY sort_order`,
          [domain.id]
        )

        for (const competency of competenciesResult.rows) {
          await client.query(
            `INSERT INTO competencies (domain_id, name, weight, level_criterion, sort_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              newDomainId,
              competency.name,
              competency.weight,
              competency.level_criterion,
              competency.sort_order,
            ]
          )
        }
      }
    }

    await client.query('COMMIT')
    return { rows: [newCatalog], rowCount: 1 }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
