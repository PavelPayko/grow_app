const ExcelJS = require('exceljs')
const pool = require('../config/db')
const { getCycleById } = require('./assessmentCycleService')
const { upsertAssessment, validateScore } = require('./competencyAssessmentService')
const {
  getFullCatalogByCatalogId,
  createBlock,
  createDomain,
  createCompetency,
  updateCompetency,
} = require('./competencyCatalogService')

function makeCompetencyKey(block, domain, name) {
  return [block, domain, name].map((part) => String(part || '').trim()).join('||')
}

function extractEmployeeName(headerValue) {
  if (headerValue === null || headerValue === undefined) {
    return null
  }
  return String(headerValue).split('\n')[0].trim()
}

function getCellValue(row, columnNumber) {
  const cell = row.getCell(columnNumber)
  const value = cell.value

  if (value && typeof value === 'object' && value.text) {
    return value.text
  }

  if (value && typeof value === 'object' && value.richText) {
    return value.richText.map((part) => part.text).join('')
  }

  return value
}

function buildImportReport(params) {
  const {
    employeeColumns,
    matchedEmployees,
    unmatchedEmployees,
    unmatchedCompetencies,
    importedCount,
  } = params

  const hasWarnings =
    unmatchedEmployees.length > 0 || unmatchedCompetencies.length > 0

  return {
    summary: {
      employees_in_file: employeeColumns.length,
      employees_matched: matchedEmployees.length,
      employees_unmatched: unmatchedEmployees.length,
      assessments_imported: importedCount,
      competencies_unmatched: unmatchedCompetencies.length,
      has_warnings: hasWarnings,
    },
    unmatched_employees: unmatchedEmployees.map((name) => ({
      name,
      reason: 'Сотрудник не найден в команде цикла по full_name',
    })),
    unmatched_competencies: unmatchedCompetencies,
  }
}

function parseCatalogRows(sheet) {
  const rows = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return
    }

    const block = getCellValue(row, 1)
    const domain = getCellValue(row, 2)
    const competencyName = getCellValue(row, 3)
    const weight = Number(getCellValue(row, 4))
    const criterion = getCellValue(row, 5)

    if (!block || !domain || !competencyName) {
      return
    }

    if (!weight || weight <= 0) {
      const error = new Error(`Некорректный вес в строке ${rowNumber}`)
      error.code = 'IMPORT_VALIDATION_FAILED'
      error.details = [{ row: rowNumber, field: 'weight', value: weight }]
      throw error
    }

    rows.push({
      rowNumber,
      block: String(block).trim(),
      domain: String(domain).trim(),
      competencyName: String(competencyName).trim(),
      weight,
      criterion: criterion ? String(criterion).trim() : '',
    })
  })

  return rows
}

function buildLookupFromCatalog(catalog) {
  const competencyMap = new Map()
  const blocksByName = new Map()
  const domainsByKey = new Map()

  for (const block of catalog.blocks) {
    blocksByName.set(block.name, { id: block.id, sort_order: block.sort_order })

    for (const domain of block.domains) {
      domainsByKey.set(`${block.name}||${domain.name}`, {
        id: domain.id,
        block_id: block.id,
        sort_order: domain.sort_order,
      })

      for (const competency of domain.competencies) {
        competencyMap.set(
          makeCompetencyKey(block.name, domain.name, competency.name),
          competency.id
        )
      }
    }
  }

  return { competencyMap, blocksByName, domainsByKey }
}

exports.importCatalogFromRows = async (params) => {
  const { catalog_id, rows } = params
  const catalog = await getFullCatalogByCatalogId({ catalog_id })
  const lookup = buildLookupFromCatalog(catalog)

  let created_blocks = 0
  let created_domains = 0
  let created_competencies = 0
  let updated_competencies = 0

  let blockSortOrder = catalog.blocks.length
  const domainSortOrders = new Map()
  const competencySortOrders = new Map()

  for (const row of rows) {
    let block = lookup.blocksByName.get(row.block)

    if (!block) {
      const blockResult = await createBlock({
        catalog_id,
        name: row.block,
        sort_order: blockSortOrder,
      })
      block = { id: blockResult.rows[0].id, sort_order: blockSortOrder }
      lookup.blocksByName.set(row.block, block)
      blockSortOrder += 1
      created_blocks += 1
    }

    const domainKey = `${row.block}||${row.domain}`
    let domain = lookup.domainsByKey.get(domainKey)

    if (!domain) {
      const domainOrder = domainSortOrders.get(row.block) || 0
      const domainResult = await createDomain({
        block_id: block.id,
        name: row.domain,
        sort_order: domainOrder,
      })
      domain = {
        id: domainResult.rows[0].id,
        block_id: block.id,
        sort_order: domainOrder,
      }
      lookup.domainsByKey.set(domainKey, domain)
      domainSortOrders.set(row.block, domainOrder + 1)
      created_domains += 1
    }

    const competencyKey = makeCompetencyKey(row.block, row.domain, row.competencyName)
    const existingCompetencyId = lookup.competencyMap.get(competencyKey)
    const competencyOrderKey = `${row.block}||${row.domain}`
    const competencySortOrder = competencySortOrders.get(competencyOrderKey) || 0

    if (existingCompetencyId) {
      await updateCompetency({
        id: existingCompetencyId,
        name: row.competencyName,
        weight: row.weight,
        level_criterion: row.criterion,
        sort_order: competencySortOrder,
      })
      updated_competencies += 1
    } else {
      const competencyResult = await createCompetency({
        domain_id: domain.id,
        name: row.competencyName,
        weight: row.weight,
        level_criterion: row.criterion,
        sort_order: competencySortOrder,
      })
      lookup.competencyMap.set(competencyKey, competencyResult.rows[0].id)
      competencySortOrders.set(competencyOrderKey, competencySortOrder + 1)
      created_competencies += 1
    }
  }

  return {
    catalog_id,
    created_blocks,
    created_domains,
    created_competencies,
    updated_competencies,
    competencyMap: lookup.competencyMap,
  }
}

async function buildCompetencyLookup(cycle_id) {
  const cycleResult = await getCycleById({ id: cycle_id })

  if (!cycleResult.rowCount) {
    const error = new Error('Цикл оценки не найден')
    error.code = 'CYCLE_NOT_FOUND'
    throw error
  }

  const cycle = cycleResult.rows[0]
  const catalog = await getFullCatalogByCatalogId({ catalog_id: cycle.catalog_id })
  const { competencyMap } = buildLookupFromCatalog(catalog)

  return { cycle, competencyMap }
}

function parseEmployeeColumns(headerRow) {
  const columns = []
  let col = 6

  while (col <= headerRow.cellCount) {
    const scoreHeader = getCellValue(headerRow, col)
    const employeeName = extractEmployeeName(scoreHeader)

    if (!employeeName) {
      break
    }

    columns.push({
      name: employeeName,
      scoreCol: col,
      evidenceCol: col + 1,
    })

    col += 2
  }

  return columns
}

function normalizeScoreValue(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'object' && value.result !== undefined) {
    return normalizeScoreValue(value.result)
  }

  return value
}

exports.importAssessmentsFromBuffer = async (params) => {
  const { buffer, cycle_id, assessed_by, import_catalog = true } = params
  const cycleResult = await getCycleById({ id: cycle_id })

  if (!cycleResult.rowCount) {
    const error = new Error('Цикл оценки не найден')
    error.code = 'CYCLE_NOT_FOUND'
    throw error
  }

  const cycle = cycleResult.rows[0]

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.getWorksheet('Оценка_сотрудников')
  if (!sheet) {
    const error = new Error('Лист "Оценка_сотрудников" не найден')
    error.code = 'INVALID_XLSX'
    throw error
  }

  const catalogRows = parseCatalogRows(sheet)
  let catalogImportResult = null
  let competencyMap

  if (import_catalog) {
    catalogImportResult = await exports.importCatalogFromRows({
      catalog_id: cycle.catalog_id,
      rows: catalogRows,
    })
    competencyMap = catalogImportResult.competencyMap
  } else {
    competencyMap = (await buildCompetencyLookup(cycle_id)).competencyMap
  }

  const usersResult = await pool.query(
    `SELECT id, full_name FROM users WHERE team_id = $1`,
    [cycle.team_id]
  )
  const usersByName = new Map(
    usersResult.rows.map((user) => [user.full_name.trim(), user.id])
  )

  const headerRow = sheet.getRow(1)
  const employeeColumns = parseEmployeeColumns(headerRow)

  const matchedEmployees = []
  const unmatchedEmployees = []

  for (const column of employeeColumns) {
    if (usersByName.has(column.name)) {
      matchedEmployees.push({
        ...column,
        user_id: usersByName.get(column.name),
      })
    } else {
      unmatchedEmployees.push(column.name)
    }
  }

  const validationErrors = []
  const unmatchedCompetencies = []
  const rowsToImport = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return
    }

    const block = getCellValue(row, 1)
    const domain = getCellValue(row, 2)
    const competencyName = getCellValue(row, 3)

    if (!block || !domain || !competencyName) {
      return
    }

    const competencyKey = makeCompetencyKey(block, domain, competencyName)
    const competencyId = competencyMap.get(competencyKey)

    if (!competencyId) {
      unmatchedCompetencies.push({
        row: rowNumber,
        block,
        domain,
        competency: competencyName,
      })
      return
    }

    for (const employee of matchedEmployees) {
      const rawScore = normalizeScoreValue(getCellValue(row, employee.scoreCol))
      const evidence = getCellValue(row, employee.evidenceCol)

      if (rawScore === null || rawScore === undefined || rawScore === '') {
        continue
      }

      try {
        const score = validateScore(rawScore)
        rowsToImport.push({
          rowNumber,
          user_id: employee.user_id,
          competency_id: competencyId,
          score,
          evidence: evidence ? String(evidence) : null,
        })
      } catch (err) {
        validationErrors.push({
          row: rowNumber,
          employee: employee.name,
          score: rawScore,
          message: err.message,
        })
      }
    }
  })

  if (validationErrors.length > 0) {
    const error = new Error('Ошибки валидации данных импорта')
    error.code = 'IMPORT_VALIDATION_FAILED'
    error.details = validationErrors
    throw error
  }

  let importedCount = 0

  for (const item of rowsToImport) {
    await upsertAssessment({
      cycle_id,
      user_id: item.user_id,
      competency_id: item.competency_id,
      score: item.score,
      evidence: item.evidence,
      assessed_by,
    })
    importedCount += 1
  }

  return {
    cycle_id,
    imported_count: importedCount,
    catalog: catalogImportResult,
    matched_employees: matchedEmployees.map((item) => item.name),
    unmatched_employees: unmatchedEmployees,
    unmatched_competencies: unmatchedCompetencies,
    report: buildImportReport({
      employeeColumns,
      matchedEmployees,
      unmatchedEmployees,
      unmatchedCompetencies,
      importedCount,
    }),
  }
}
