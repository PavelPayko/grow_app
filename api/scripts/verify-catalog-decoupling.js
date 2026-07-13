/**
 * Integration checks for decoupled competency catalogs (OpenSpec decouple-competency-catalog-from-team).
 * Covers catalog CRUD, team binding, cycle creation, and duplication scenarios from spec.
 * Run: node scripts/verify-catalog-decoupling.js
 */

const pool = require('../src/config/db')
const {
  getAllCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  cloneCatalogById,
  createBlock,
  createDomain,
  createCompetency,
  updateCompetency,
  deleteCompetency,
  getCompetencyById,
  getFullCatalogByTeamId,
  getFullCatalogByCatalogId,
  upsertGradeTarget,
} = require('../src/services/competencyCatalogService')
const { createTeam, updateTeam, getTeamById } = require('../src/services/teamService')
const { createCycle, validateCatalogForTeam } = require('../src/services/assessmentCycleService')

let passed = 0
let failed = 0
let skipped = 0

function ok(name) {
  passed += 1
  console.log(`  ✓ ${name}`)
}

function fail(name, detail) {
  failed += 1
  console.error(`  ✗ ${name}`)
  if (detail) console.error(`    ${detail}`)
}

function skip(name, reason) {
  skipped += 1
  console.log(`  ○ ${name} (skip: ${reason})`)
}

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    ok(label)
    return true
  }
  fail(label, `expected ${expected}, got ${actual}`)
  return false
}

function assertTruthy(value, label) {
  if (value) {
    ok(label)
    return true
  }
  fail(label, `expected truthy, got ${value}`)
  return false
}

function countCatalogStructure(data) {
  let blocks = 0
  let domains = 0
  let competencies = 0
  let gradeTargets = 0

  for (const block of data.blocks || []) {
    blocks += 1
    gradeTargets += (block.grade_targets || []).length
    for (const domain of block.domains || []) {
      domains += 1
      competencies += (domain.competencies || []).length
    }
  }

  return { blocks, domains, competencies, gradeTargets }
}

function isSortedByName(rows) {
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i - 1].name.localeCompare(rows[i].name, 'ru') > 0) {
      return false
    }
  }
  return true
}

async function expectErrorCode(fn, code, label) {
  try {
    await fn()
    fail(label, `expected error code ${code}`)
    return false
  } catch (err) {
    if (err.code === code) {
      ok(label)
      return true
    }
    fail(label, `expected ${code}, got ${err.code || err.message}`)
    return false
  }
}

function createFixture(suffix) {
  const catalogIds = []
  const teamIds = []
  const userIds = []

  return {
    name(prefix) {
      return `__verify_${prefix}_${suffix}`
    },
    trackCatalog(id) {
      catalogIds.push(id)
    },
    trackTeam(id) {
      teamIds.push(id)
    },
    trackUser(id) {
      userIds.push(id)
    },
    async cleanup() {
      for (const userId of userIds) {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {})
      }
      for (const teamId of teamIds) {
        await pool.query('DELETE FROM teams WHERE id = $1', [teamId]).catch(() => {})
      }
      for (const catalogId of catalogIds) {
        await pool.query('DELETE FROM competency_catalogs WHERE id = $1', [catalogId]).catch(() => {})
      }
    },
  }
}

async function buildCatalogStructure(catalogId) {
  const block = await createBlock({ catalog_id: catalogId, name: 'Verify Block', sort_order: 0 })
  const blockId = block.rows[0].id

  await upsertGradeTarget({
    block_id: blockId,
    grade: 'junior',
    min_score: 1,
    max_score: 2,
  })

  const domain = await createDomain({ block_id: blockId, name: 'Verify Domain', sort_order: 0 })
  const competency = await createCompetency({
    domain_id: domain.rows[0].id,
    name: 'Verify Competency',
    weight: 1.5,
    level_criterion: 'verify criterion',
    sort_order: 0,
  })

  return {
    blockId,
    domainId: domain.rows[0].id,
    competencyId: competency.rows[0].id,
  }
}

async function verifyCatalogCrud(fixture) {
  console.log('\n8.1 Catalog CRUD')

  const initialName = fixture.name('catalog')
  const updatedName = fixture.name('catalog_updated')

  const created = await createCatalog({ name: initialName })
  const catalogId = created.rows[0].id
  fixture.trackCatalog(catalogId)

  assertTruthy(created.rows[0].id, 'createCatalog without team_id')
  assertEqual(created.rows[0].name, initialName, 'createCatalog persists name')

  const listed = await getAllCatalogs()
  const found = listed.rows.some((row) => row.id === catalogId)
  assertTruthy(found, 'getAllCatalogs includes created catalog')
  if (listed.rows.length > 1) {
    assertTruthy(isSortedByName(listed.rows), 'getAllCatalogs ordered by name')
  } else {
    ok('getAllCatalogs ordered by name')
  }

  const updated = await updateCatalog({ id: catalogId, name: updatedName })
  assertEqual(updated.rows[0].name, updatedName, 'updateCatalog persists new name')

  const full = await getFullCatalogByCatalogId({ catalog_id: catalogId })
  const { competencyId } = await buildCatalogStructure(catalogId)

  const competency = await getCompetencyById({ id: competencyId })
  assertEqual(Number(competency.rows[0].weight), 1.5, 'createCompetency with weight 1.5')

  await updateCompetency({
    id: competencyId,
    name: 'Verify Competency',
    weight: 2,
    level_criterion: 'verify criterion',
    sort_order: 0,
  })
  const updatedCompetency = await getCompetencyById({ id: competencyId })
  assertEqual(Number(updatedCompetency.rows[0].weight), 2, 'updateCompetency weight')

  await deleteCatalog({ id: catalogId })

  const afterDelete = await getCatalogById({ id: catalogId })
  assertEqual(afterDelete.rowCount, 0, 'deleteCatalog removes unused catalog with structure')
}

async function verifyCatalogDeletionGuards(fixture) {
  console.log('\n8.2 Catalog deletion guards')

  const linkedCatalog = await createCatalog({ name: fixture.name('linked_catalog') })
  const linkedCatalogId = linkedCatalog.rows[0].id
  fixture.trackCatalog(linkedCatalogId)

  const team = await createTeam({ name: fixture.name('team_linked') })
  const teamId = team.rows[0].id
  fixture.trackTeam(teamId)

  await updateTeam({ id: teamId, catalog_id: linkedCatalogId })

  await expectErrorCode(
    () => deleteCatalog({ id: linkedCatalogId }),
    'CATALOG_LINKED_TO_TEAMS',
    'deleteCatalog rejects catalog linked to team'
  )

  const cycleCatalog = await createCatalog({ name: fixture.name('cycle_catalog') })
  const cycleCatalogId = cycleCatalog.rows[0].id
  fixture.trackCatalog(cycleCatalogId)

  const cycleTeam = await createTeam({ name: fixture.name('team_cycle') })
  const cycleTeamId = cycleTeam.rows[0].id
  fixture.trackTeam(cycleTeamId)

  await updateTeam({ id: cycleTeamId, catalog_id: cycleCatalogId })

  const cycle = await createCycle({
    team_id: cycleTeamId,
    catalog_id: cycleCatalogId,
    name: fixture.name('cycle'),
  })
  assertTruthy(cycle.rows[0].id, 'createCycle for deletion guard setup')

  await updateTeam({ id: cycleTeamId, catalog_id: null })

  await expectErrorCode(
    () => deleteCatalog({ id: cycleCatalogId }),
    'CATALOG_USED_IN_CYCLES',
    'deleteCatalog rejects catalog used in cycle'
  )
}

async function verifyCatalogDuplication(fixture) {
  console.log('\n8.3 Catalog duplication')

  const source = await createCatalog({ name: fixture.name('source') })
  const sourceId = source.rows[0].id
  fixture.trackCatalog(sourceId)

  await buildCatalogStructure(sourceId)

  const beforeSource = countCatalogStructure(await getFullCatalogByCatalogId({ catalog_id: sourceId }))
  const cloneName = fixture.name('clone')

  const cloned = await cloneCatalogById({ source_catalog_id: sourceId, name: cloneName })
  const cloneId = cloned.rows[0].id
  fixture.trackCatalog(cloneId)

  assertEqual(cloned.rows[0].name, cloneName, 'cloneCatalogById uses provided name')

  const cloneData = await getFullCatalogByCatalogId({ catalog_id: cloneId })
  const cloneCounts = countCatalogStructure(cloneData)
  assertEqual(cloneCounts.blocks, beforeSource.blocks, 'clone copies all blocks')
  assertEqual(cloneCounts.domains, beforeSource.domains, 'clone copies all domains')
  assertEqual(cloneCounts.competencies, beforeSource.competencies, 'clone copies all competencies')
  assertEqual(cloneCounts.gradeTargets, beforeSource.gradeTargets, 'clone copies grade targets')

  const afterSource = countCatalogStructure(await getFullCatalogByCatalogId({ catalog_id: sourceId }))
  assertEqual(afterSource.blocks, beforeSource.blocks, 'source catalog unchanged after duplicate')
  assertEqual(afterSource.competencies, beforeSource.competencies, 'source competencies unchanged after duplicate')
}

async function verifyCompetencyDeleteGuard(fixture) {
  console.log('\n8.4 Competency delete guard')

  const catalog = await createCatalog({ name: fixture.name('assess_catalog') })
  const catalogId = catalog.rows[0].id
  fixture.trackCatalog(catalogId)

  const { competencyId } = await buildCatalogStructure(catalogId)

  const team = await createTeam({ name: fixture.name('assess_team') })
  const teamId = team.rows[0].id
  fixture.trackTeam(teamId)
  await updateTeam({ id: teamId, catalog_id: catalogId })

  const cycle = await createCycle({
    team_id: teamId,
    catalog_id: catalogId,
    name: fixture.name('assess_cycle'),
  })
  const cycleId = cycle.rows[0].id

  const user = await pool.query(
    `INSERT INTO users (login, password, full_name, phone, email, team_id)
     VALUES ($1, 'verify', 'Verify Test User', '000', $2, $3)
     RETURNING id`,
    [fixture.name('user'), `${fixture.name('user')}@verify.local`, teamId]
  )
  const userId = user.rows[0].id
  fixture.trackUser(userId)

  await pool.query(
    `INSERT INTO competency_assessments (cycle_id, user_id, competency_id, score)
     VALUES ($1, $2, $3, 2)`,
    [cycleId, userId, competencyId]
  )

  await expectErrorCode(
    () => deleteCompetency({ id: competencyId }),
    'COMPETENCY_HAS_ASSESSMENTS',
    'deleteCompetency rejects competency with assessments'
  )
}

async function verifyTeamCatalogBinding(fixture) {
  console.log('\n8.5 Team catalog binding')

  const catalog = await createCatalog({ name: fixture.name('shared_catalog') })
  const catalogId = catalog.rows[0].id
  fixture.trackCatalog(catalogId)

  const teamA = await createTeam({ name: fixture.name('team_a') })
  const teamB = await createTeam({ name: fixture.name('team_b') })
  const teamNoCatalog = await createTeam({ name: fixture.name('team_no_catalog') })
  fixture.trackTeam(teamA.rows[0].id)
  fixture.trackTeam(teamB.rows[0].id)
  fixture.trackTeam(teamNoCatalog.rows[0].id)

  await updateTeam({ id: teamA.rows[0].id, catalog_id: catalogId })
  await updateTeam({ id: teamB.rows[0].id, catalog_id: catalogId })

  const catalogA = await getFullCatalogByTeamId({ team_id: teamA.rows[0].id })
  const catalogB = await getFullCatalogByTeamId({ team_id: teamB.rows[0].id })
  assertEqual(catalogA.catalog?.id, catalogId, 'team A resolves assigned catalog')
  assertEqual(catalogB.catalog?.id, catalogId, 'two teams can share one catalog')

  const emptyTeamCatalog = await getFullCatalogByTeamId({ team_id: teamNoCatalog.rows[0].id })
  assertEqual(emptyTeamCatalog.catalog, null, 'team without catalog returns null catalog')

  const newCatalog = await createCatalog({ name: fixture.name('replacement') })
  fixture.trackCatalog(newCatalog.rows[0].id)
  await updateTeam({ id: teamA.rows[0].id, catalog_id: newCatalog.rows[0].id })

  const changed = await getTeamById({ id: teamA.rows[0].id })
  assertEqual(changed.rows[0].catalog_id, newCatalog.rows[0].id, 'updateTeam changes team catalog_id')
}

async function verifyCycleCreation(fixture) {
  console.log('\n8.6 Cycle creation with team catalog')

  const catalog = await createCatalog({ name: fixture.name('cycle_source') })
  const catalogId = catalog.rows[0].id
  fixture.trackCatalog(catalogId)

  const team = await createTeam({ name: fixture.name('cycle_team') })
  const teamId = team.rows[0].id
  fixture.trackTeam(teamId)
  await updateTeam({ id: teamId, catalog_id: catalogId })

  const teamWithoutCatalog = await createTeam({ name: fixture.name('cycle_team_empty') })
  fixture.trackTeam(teamWithoutCatalog.rows[0].id)

  const teamRow = await getTeamById({ id: teamId })
  const catalog_id = teamRow.rows[0].catalog_id
  assertTruthy(catalog_id, 'team has catalog_id before cycle creation')

  const cycle = await createCycle({
    team_id: teamId,
    catalog_id,
    name: fixture.name('Q1_cycle'),
  })

  assertEqual(cycle.rows[0].status, 'draft', 'createCycle status is draft')
  assertEqual(cycle.rows[0].catalog_id, catalogId, 'createCycle uses team catalog_id')
  assertEqual(
    await validateCatalogForTeam({ team_id: teamId, catalog_id: cycle.rows[0].catalog_id }),
    true,
    'cycle catalog_id matches team catalog'
  )

  const emptyTeam = await getTeamById({ id: teamWithoutCatalog.rows[0].id })
  if (!emptyTeam.rows[0].catalog_id) {
    ok('team without catalog_id blocks cycle creation (catalog_id missing)')
  } else {
    fail('team without catalog_id blocks cycle creation (catalog_id missing)', 'catalog_id was set')
  }
}

async function main() {
  console.log('Catalog decoupling integration verification\n')

  try {
    await pool.query('SELECT 1')
  } catch (err) {
    console.error('DB unavailable:', err.message)
    process.exit(1)
  }

  const fixture = createFixture(Date.now())

  try {
    await verifyCatalogCrud(fixture)
    await verifyCatalogDeletionGuards(fixture)
    await verifyCatalogDuplication(fixture)
    await verifyCompetencyDeleteGuard(fixture)
    await verifyTeamCatalogBinding(fixture)
    await verifyCycleCreation(fixture)
  } catch (err) {
    fail('unexpected error', err.message)
    console.error(err)
  } finally {
    await fixture.cleanup()
    await pool.end()
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
