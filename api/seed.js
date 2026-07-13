const pool = require('./src/config/db')
const { DEFAULT_TEAM_NAME } = require('./src/config/seed/defaultTeam')
const {
  NAC_CATALOG_NAME,
  NAC_GRADE_TARGETS,
  NAC_COMPETENCIES,
} = require('./src/config/seed/catalogs/nac')
const { assignUsersToDefaultTeam } = require('./src/config/seed/assignUsersToDefaultTeam')

async function seedCatalog(client, { catalogName, gradeTargets, competencies }) {
  const existingCatalog = await client.query(
    'SELECT id FROM competency_catalogs WHERE name = $1',
    [catalogName]
  )

  if (existingCatalog.rows.length > 0) {
    console.log(`Каталог "${catalogName}" уже существует — seed пропущен`)
    return existingCatalog.rows[0].id
  }

  const catalogResult = await client.query(
    `INSERT INTO competency_catalogs (name)
     VALUES ($1)
     RETURNING id`,
    [catalogName]
  )
  const catalogId = catalogResult.rows[0].id

  const blockOrder = []
  const domainKeys = new Map()
  const blockIds = new Map()

  for (const item of competencies) {
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

    const targets = gradeTargets[blockName]
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
  for (const item of competencies) {
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

  console.log(
    `Каталог "${catalogName}": ${competencies.length} компетенций, ${blockOrder.length} блоков`
  )
  return catalogId
}

async function linkCatalogToTeam(client, teamName, catalogId) {
  const teamRow = await client.query(
    'SELECT id, catalog_id FROM teams WHERE name = $1',
    [teamName]
  )

  let teamId
  if (teamRow.rows.length > 0) {
    teamId = teamRow.rows[0].id
    if (teamRow.rows[0].catalog_id) {
      console.log(`Команда "${teamName}" уже привязана к каталогу — привязка пропущена`)
      return teamId
    }
  } else {
    const teamResult = await client.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING id',
      [teamName]
    )
    teamId = teamResult.rows[0].id
  }

  await client.query(
    'UPDATE teams SET catalog_id = $1 WHERE id = $2',
    [catalogId, teamId]
  )

  console.log(`Команда "${teamName}" привязана к каталогу`)
  return teamId
}

async function seedNacCatalogForDefaultTeam(client) {
  const catalogId = await seedCatalog(client, {
    catalogName: NAC_CATALOG_NAME,
    gradeTargets: NAC_GRADE_TARGETS,
    competencies: NAC_COMPETENCIES,
  })
  return linkCatalogToTeam(client, DEFAULT_TEAM_NAME, catalogId)
}

;(async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await seedNacCatalogForDefaultTeam(client)
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

module.exports = {
  seedCatalog,
  linkCatalogToTeam,
  seedNacCatalogForDefaultTeam,
  assignUsersToDefaultTeam,
}
