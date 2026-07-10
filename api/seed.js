const pool = require('./src/config/db')
const {
  DEFAULT_TEAM_NAME,
  DEFAULT_CATALOG_NAME,
  GRADE_TARGETS,
  COMPETENCIES,
} = require('./src/config/seed/competencyCatalogSeed')
const { assignUsersToDefaultTeam } = require('./src/config/seed/assignUsersToDefaultTeam')

async function seedCompetencyCatalog(client) {
  const existingTeam = await client.query(
    'SELECT id FROM teams WHERE name = $1',
    [DEFAULT_TEAM_NAME]
  )

  if (existingTeam.rows.length > 0) {
    console.log(`Команда "${DEFAULT_TEAM_NAME}" уже существует — seed пропущен`)
    return existingTeam.rows[0].id
  }

  const teamResult = await client.query(
    'INSERT INTO teams (name) VALUES ($1) RETURNING id',
    [DEFAULT_TEAM_NAME]
  )
  const teamId = teamResult.rows[0].id

  const catalogResult = await client.query(
    `INSERT INTO competency_catalogs (team_id, name, is_active)
     VALUES ($1, $2, true)
     RETURNING id`,
    [teamId, DEFAULT_CATALOG_NAME]
  )
  const catalogId = catalogResult.rows[0].id

  const blockOrder = []
  const domainKeys = new Map()
  const blockIds = new Map()

  for (const item of COMPETENCIES) {
    if (!blockOrder.includes(item.block)) {
      blockOrder.push(item.block)
    }
    domainKeys.set(`${item.block}::${item.domain}`, { block: item.block, domain: item.domain })
  }

  for (let i = 0; i < blockOrder.length; i++) {
    const blockName = blockOrder[i]
    const blockResult = await client.query(
      `INSERT INTO competency_blocks (catalog_id, name, sort_order)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [catalogId, blockName, i]
    )
    blockIds.set(blockName, blockResult.rows[0].id)

    const targets = GRADE_TARGETS[blockName]
    if (targets) {
      for (const [grade, [minScore, maxScore]] of Object.entries(targets)) {
        await client.query(
          `INSERT INTO grade_targets (block_id, grade, min_score, max_score)
           VALUES ($1, $2, $3, $4)`,
          [blockResult.rows[0].id, grade, minScore, maxScore]
        )
      }
    }
  }

  const domainIds = new Map()
  const domainsByBlock = new Map()

  for (const { block, domain } of domainKeys.values()) {
    if (!domainsByBlock.has(block)) {
      domainsByBlock.set(block, [])
    }
    const list = domainsByBlock.get(block)
    if (!list.includes(domain)) {
      list.push(domain)
    }
  }

  for (const [blockName, domains] of domainsByBlock.entries()) {
    for (let i = 0; i < domains.length; i++) {
      const domainName = domains[i]
      const domainResult = await client.query(
        `INSERT INTO competency_domains (block_id, name, sort_order)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [blockIds.get(blockName), domainName, i]
      )
      domainIds.set(`${blockName}::${domainName}`, domainResult.rows[0].id)
    }
  }

  const competencyCountByBlock = new Map()
  for (const item of COMPETENCIES) {
    const key = `${item.block}::${item.domain}`
    const domainId = domainIds.get(key)
    const sortOrder = competencyCountByBlock.get(key) || 0
    competencyCountByBlock.set(key, sortOrder + 1)

    await client.query(
      `INSERT INTO competencies (domain_id, name, weight, level_criterion, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [domainId, item.name, item.weight, item.criterion, sortOrder]
    )
  }

  console.log(`Seed выполнен: команда "${DEFAULT_TEAM_NAME}", ${COMPETENCIES.length} компетенций, ${blockOrder.length} блоков`)
  return teamId
}

;(async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await seedCompetencyCatalog(client)
    await assignUsersToDefaultTeam(client)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Ошибка seed:', err.stack || err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
})()

module.exports = { seedCompetencyCatalog, assignUsersToDefaultTeam }
