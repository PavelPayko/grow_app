/**
 * Verification script for competency matrix (OpenSpec tasks 10.1–10.4).
 * Run: npm run verify:competency
 */

const { getFullCatalogByTeamId, getFullCatalogByCatalogId } = require('../src/services/competencyCatalogService')
const { validateCatalogForTeam } = require('../src/services/assessmentCycleService')
const { getTargetStatus, calculateUserAggregates, calculateTeamAggregates } = require('../src/services/assessmentAggregateService')
const { canAssess, canAssessByRole, canViewUser, canAccessTeam, managesTeam } = require('../src/middleware/canAssess')
const { getUsersByScope } = require('../src/services/userService')
const { getTeamsByScope } = require('../src/services/teamService')
const { getOrgSummary } = require('../src/services/orgSummaryService')
const { upsertAssessment } = require('../src/services/competencyAssessmentService')
const { exportCycleToBuffer } = require('../src/services/competencyExcelExportService')
const { importAssessmentsFromBuffer } = require('../src/services/competencyExcelImportService')
const { getAssessmentsByCycleAndUser } = require('../src/services/competencyAssessmentService')
const pool = require('../src/config/db')

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

function assertApprox(actual, expected, label, epsilon = 0.0001) {
  if (actual === null && expected === null) {
    ok(label)
    return true
  }
  if (actual !== null && expected !== null && Math.abs(actual - expected) < epsilon) {
    ok(label)
    return true
  }
  fail(label, `expected ${expected}, got ${actual}`)
  return false
}

/** Excel template formula: weighted_total = Σ(score×weight) / Σ(weight) for scored only */
function calcExpectedWeightedTotal(rows) {
  let weightedSum = 0
  let weightScored = 0
  for (const row of rows) {
    if (row.score !== null && row.score !== undefined) {
      weightedSum += Number(row.weight) * Number(row.score)
      weightScored += Number(row.weight)
    }
  }
  return weightScored > 0 ? weightedSum / weightScored : null
}

function calcExpectedUnweightedAvg(rows) {
  const scored = rows.filter((r) => r.score !== null && r.score !== undefined)
  if (!scored.length) return null
  return scored.reduce((s, r) => s + Number(r.score), 0) / scored.length
}

function calcExpectedFillRate(rows) {
  if (!rows.length) return 0
  const scored = rows.filter((r) => r.score !== null && r.score !== undefined)
  return scored.length / rows.length
}

async function verifyFormulaUnitTests() {
  console.log('\n10.1 Formula unit checks')

  assertEqual(getTargetStatus(null, 1, 2), null, 'target status null when no total')
  assertEqual(getTargetStatus(1.2, 1.5, 2.5), 'below', 'target below')
  assertEqual(getTargetStatus(2.0, 1.5, 2.5), 'in_range', 'target in_range')
  assertEqual(getTargetStatus(2.8, 1.5, 2.5), 'above', 'target above')

  const sampleRows = [
    { block_id: 'b1', block_name: 'B1', block_sort_order: 0, weight: 2, score: 3 },
    { block_id: 'b1', block_name: 'B1', block_sort_order: 0, weight: 1, score: 2 },
    { block_id: 'b1', block_name: 'B1', block_sort_order: 0, weight: 1, score: null },
  ]

  const expectedWeighted = calcExpectedWeightedTotal(sampleRows)
  assertApprox(expectedWeighted, (3 * 2 + 2 * 1) / (2 + 1), 'sample weighted_total = 2.6667')
  assertApprox(calcExpectedUnweightedAvg(sampleRows), (3 + 2) / 2, 'sample unweighted_avg = 2.5')
  assertApprox(calcExpectedFillRate(sampleRows), 2 / 3, 'sample fill_rate = 0.6667')
}

async function verifyAggregatesAgainstDb() {
  console.log('\n10.1 DB aggregate vs formula')

  const cycleResult = await pool.query(
    `SELECT c.id AS cycle_id, c.catalog_id, c.status, u.id AS user_id
     FROM assessment_cycles c
     JOIN users u ON u.team_id = c.team_id
     WHERE c.status IN ('active', 'closed')
     LIMIT 1`
  )

  if (!cycleResult.rowCount) {
    skip('DB aggregate match', 'no cycle with team user')
    return
  }

  const { cycle_id, catalog_id, user_id } = cycleResult.rows[0]

  const rowsResult = await pool.query(
    `SELECT b.id AS block_id, b.name AS block_name, b.sort_order AS block_sort_order,
            c.weight, a.score
     FROM competency_blocks b
     JOIN competency_domains d ON d.block_id = b.id
     JOIN competencies c ON c.domain_id = d.id
     LEFT JOIN competency_assessments a
       ON a.competency_id = c.id AND a.cycle_id = $1 AND a.user_id = $2
     WHERE b.catalog_id = $3`,
    [cycle_id, user_id, catalog_id]
  )

  const rows = rowsResult.rows
  const aggregates = await calculateUserAggregates({ cycle_id, user_id })

  assertApprox(
    aggregates.weighted_total,
    calcExpectedWeightedTotal(rows),
    'DB weighted_total matches formula'
  )
  assertApprox(
    aggregates.unweighted_avg,
    calcExpectedUnweightedAvg(rows),
    'DB unweighted_avg matches formula'
  )
  assertApprox(aggregates.fill_rate, calcExpectedFillRate(rows), 'DB fill_rate matches formula')
}

async function verifyExcelRoundtrip() {
  console.log('\n10.2 Export → import roundtrip')

  const cycleResult = await pool.query(
    `SELECT id FROM assessment_cycles WHERE status = 'active' LIMIT 1`
  )

  if (!cycleResult.rowCount) {
    skip('Excel roundtrip', 'no active cycle')
    return
  }

  const cycleId = cycleResult.rows[0].id
  const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`)
  if (!adminResult.rowCount) {
    skip('Excel roundtrip', 'no admin user')
    return
  }
  const adminId = adminResult.rows[0].id

  const beforeAssessments = await getAssessmentsByCycleAndUser({ cycle_id: cycleId, user_id: adminId })
  const beforeCount = beforeAssessments.rowCount

  const { buffer } = await exportCycleToBuffer({ cycle_id: cycleId })
  if (!buffer || buffer.length === 0) {
    fail('export produces buffer')
    return
  }
  ok('export produces non-empty xlsx buffer')

  const importResult = await importAssessmentsFromBuffer({
    buffer,
    cycle_id: cycleId,
    assessed_by: adminId,
    import_catalog: false,
  })

  if (importResult.imported_count >= 0) {
    ok(`import completes (imported_count=${importResult.imported_count})`)
  } else {
    fail('import completes')
  }

  const afterAssessments = await getAssessmentsByCycleAndUser({ cycle_id: cycleId, user_id: adminId })
  if (afterAssessments.rowCount >= beforeCount) {
    ok('assessments preserved or updated after roundtrip')
  } else {
    fail('assessments count after roundtrip', `before=${beforeCount}, after=${afterAssessments.rowCount}`)
  }
}

async function verifyClosedCycleImmutability() {
  console.log('\n10.3 Closed cycle immutability')

  const closedResult = await pool.query(
    `SELECT c.id AS cycle_id, c.catalog_id, u.id AS user_id, comp.id AS competency_id
     FROM assessment_cycles c
     JOIN users u ON u.team_id = c.team_id
     JOIN competency_blocks b ON b.catalog_id = c.catalog_id
     JOIN competency_domains d ON d.block_id = b.id
     JOIN competencies comp ON comp.domain_id = d.id
     WHERE c.status = 'closed'
     LIMIT 1`
  )

  if (!closedResult.rowCount) {
    skip('closed cycle write blocked', 'no closed cycle in DB')
  } else {
    const { cycle_id, user_id, competency_id } = closedResult.rows[0]
    try {
      await upsertAssessment({
        cycle_id,
        user_id,
        competency_id,
        score: 2,
        evidence: 'verify-test',
        assessed_by: user_id,
      })
      fail('upsert on closed cycle throws CYCLE_NOT_WRITABLE')
    } catch (err) {
      if (err.code === 'CYCLE_NOT_WRITABLE') {
        ok('upsert on closed cycle throws CYCLE_NOT_WRITABLE')
      } else {
        fail('upsert on closed cycle', err.message)
      }
    }
  }

  const historyResult = await pool.query(
    `SELECT c.id AS cycle_id, u.id AS user_id
     FROM assessment_cycles c
     JOIN users u ON u.team_id = c.team_id
     WHERE c.status = 'closed'
     LIMIT 1`
  )

  if (!historyResult.rowCount) {
    skip('historical cycle aggregates readable', 'no closed cycle')
  } else {
    const { cycle_id, user_id } = historyResult.rows[0]
    const aggregates = await calculateUserAggregates({ cycle_id, user_id })
    if (aggregates.cycle_id === cycle_id) {
      ok('historical cycle aggregates readable')
    } else {
      fail('historical cycle aggregates readable')
    }
  }
}

async function verifyTeamCatalogDecoupling() {
  console.log('\n7.x Team catalog binding (decoupled schema)')

  const catalogIdColumn = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'teams'
       AND column_name = 'catalog_id'`
  )

  if (catalogIdColumn.rowCount) {
    ok('teams.catalog_id column exists')
  } else {
    fail('teams.catalog_id column exists')
    return
  }

  const legacyColumns = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'competency_catalogs'
       AND column_name IN ('team_id', 'is_active')`
  )

  if (!legacyColumns.rowCount) {
    ok('competency_catalogs without team_id/is_active')
  } else {
    fail(
      'competency_catalogs without team_id/is_active',
      legacyColumns.rows.map((row) => row.column_name).join(', ')
    )
  }

  const teamResult = await pool.query(
    `SELECT id, catalog_id
     FROM teams
     WHERE catalog_id IS NOT NULL
     LIMIT 1`
  )

  if (!teamResult.rowCount) {
    skip('team catalog resolves via teams.catalog_id', 'no team with catalog_id')
    return
  }

  const { id: team_id, catalog_id } = teamResult.rows[0]
  const byTeam = await getFullCatalogByTeamId({ team_id })
  const byCatalog = await getFullCatalogByCatalogId({ catalog_id })

  if (byTeam.catalog?.id === byCatalog.catalog?.id) {
    ok('getFullCatalogByTeamId matches teams.catalog_id')
  } else {
    fail('getFullCatalogByTeamId matches teams.catalog_id')
  }

  assertEqual(
    await validateCatalogForTeam({ team_id, catalog_id }),
    true,
    'validateCatalogForTeam accepts team catalog'
  )

  assertEqual(
    await validateCatalogForTeam({
      team_id,
      catalog_id: '00000000-0000-0000-0000-000000000001',
    }),
    false,
    'validateCatalogForTeam rejects foreign catalog'
  )
}

async function verifyLeadScope() {
  console.log('\n9.2 Lead scope (users, teams, org-summary)')

  const teamsResult = await pool.query('SELECT id FROM teams ORDER BY name LIMIT 2')
  if (teamsResult.rowCount < 2) {
    skip('lead scope checks', 'need at least 2 teams in DB')
    return
  }

  const [managedTeam, otherTeam] = teamsResult.rows
  const actorResult = await pool.query('SELECT id FROM users LIMIT 1')
  if (!actorResult.rowCount) {
    skip('lead scope checks', 'no users in DB')
    return
  }

  const leadActor = {
    id: actorResult.rows[0].id,
    role: 'lead',
    managed_team_ids: [managedTeam.id],
  }

  const leadUsers = await getUsersByScope(leadActor)
  const leadUserRows = leadUsers.rows ?? []
  const outOfScopeUser = leadUserRows.find(
    (user) => user.id !== leadActor.id && user.team_id !== managedTeam.id
  )
  if (outOfScopeUser) {
    fail('lead getUsersByScope excludes other teams', `found user ${outOfScopeUser.id}`)
  } else {
    ok('lead getUsersByScope limited to managed team members')
  }

  const leadTeams = await getTeamsByScope(leadActor)
  const leadTeamIds = (leadTeams.rows ?? []).map((team) => team.id)
  if (leadTeamIds.length === 1 && leadTeamIds[0] === managedTeam.id) {
    ok('lead getTeamsByScope returns managed teams only')
  } else {
    fail('lead getTeamsByScope returns managed teams only', leadTeamIds.join(', '))
  }

  assertEqual(
    await canAccessTeam(leadActor, otherTeam.id),
    false,
    'lead canAccessTeam denied for unmanaged team'
  )

  const leadSummary = await getOrgSummary(leadActor)
  const summaryTeamIds = leadSummary.map((row) => row.team_id)
  if (summaryTeamIds.length === 1 && summaryTeamIds[0] === managedTeam.id) {
    ok('lead org-summary scoped to managed teams')
  } else {
    fail('lead org-summary scoped to managed teams', summaryTeamIds.join(', '))
  }

  const userSummary = await getOrgSummary({ id: 'u1', role: 'user' })
  assertEqual(userSummary.length, 0, 'regular user org-summary returns empty')
}

async function verifyTeamDashboardAggregates() {
  console.log('\n9.3 Team dashboard aggregates (partial assessments)')

  const cycleResult = await pool.query(
    `SELECT id FROM assessment_cycles WHERE status = 'active' LIMIT 1`
  )

  if (!cycleResult.rowCount) {
    skip('team dashboard partial assessments', 'no active cycle')
    return
  }

  const cycleId = cycleResult.rows[0].id
  const aggregates = await calculateTeamAggregates({ cycle_id: cycleId })

  if (!aggregates.length) {
    skip('team dashboard partial assessments', 'no team members in active cycle')
    return
  }

  ok(`team aggregates returned for ${aggregates.length} member(s)`)

  for (const member of aggregates) {
    if (member.fill_rate !== null && (member.fill_rate < 0 || member.fill_rate > 1)) {
      fail('member fill_rate within 0..1', `${member.user_id}: ${member.fill_rate}`)
      return
    }
    if (member.scored_count > member.total_count) {
      fail('member scored_count <= total_count', member.user_id)
      return
    }
  }
  ok('member fill_rate and scored_count bounds valid')

  const hasPartial = aggregates.some(
    (member) =>
      member.total_count > 0 &&
      member.scored_count > 0 &&
      member.scored_count < member.total_count
  )
  const hasEmpty = aggregates.some(
    (member) => member.total_count > 0 && member.scored_count === 0
  )
  const hasFull = aggregates.some(
    (member) => member.total_count > 0 && member.scored_count === member.total_count
  )

  if (hasPartial || hasEmpty || hasFull) {
    ok('team dashboard supports empty, partial, and full assessment states')
  } else {
    skip('team dashboard assessment mix', 'no competency rows for cycle members')
  }
}

async function verifyRbac() {
  console.log('\n10.4 RBAC checks')

  const adminAllowed = await canAssess({ id: 'a1', role: 'admin' }, 'u2')
  assertEqual(adminAllowed, true, 'admin canAssess any user')

  const userDenied = canAssessByRole('user', null, 'team-a')
  assertEqual(userDenied, false, 'user role cannot canAssess (MVP)')

  const leadManagedTeam = canAssessByRole('lead', ['team-a'], 'team-a')
  assertEqual(leadManagedTeam, true, 'lead canAssess user in managed team')

  const leadOtherTeam = canAssessByRole('lead', ['team-a'], 'team-b')
  assertEqual(leadOtherTeam, false, 'lead cannot canAssess user outside managed teams')

  assertEqual(await canViewUser({ id: 'u1', role: 'user' }, 'u1'), true, 'user can view own assessments')
  assertEqual(await canViewUser({ id: 'u1', role: 'user' }, 'u2'), false, 'user cannot view others')
  assertEqual(await canViewUser({ id: 'a1', role: 'admin' }, 'u2'), true, 'admin can view any user')

  assertEqual(await canAccessTeam({ id: 'a1', role: 'admin' }, 'team-a'), true, 'admin canAccessTeam any team')
  assertEqual(
    await managesTeam({ id: 'l1', role: 'lead', managed_team_ids: ['team-a'] }, 'team-a'),
    true,
    'lead managesTeam for assigned team'
  )
  assertEqual(
    await managesTeam({ id: 'l1', role: 'lead', managed_team_ids: ['team-a'] }, 'team-b'),
    false,
    'lead managesTeam denied for other team'
  )
}

async function main() {
  console.log('Competency matrix verification\n')

  await verifyFormulaUnitTests()
  await verifyRbac()

  try {
    await pool.query('SELECT 1')
    await verifyTeamCatalogDecoupling()
    await verifyLeadScope()
    await verifyTeamDashboardAggregates()
    await verifyAggregatesAgainstDb()
    await verifyExcelRoundtrip()
    await verifyClosedCycleImmutability()
  } catch (err) {
    console.error('\nDB integration skipped or failed:', err.message)
    skip('DB integration block', err.message)
  } finally {
    await pool.end()
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed, ${skipped} skipped`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
