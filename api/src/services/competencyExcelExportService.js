const ExcelJS = require('exceljs')
const pool = require('../config/db')
const { getCycleById } = require('./assessmentCycleService')
const { getAssessmentsByCycleAndUser } = require('./competencyAssessmentService')
const { calculateUserAggregates } = require('./assessmentAggregateService')
const { getFullCatalogByCatalogId } = require('./competencyCatalogService')

function flattenCompetencies(blocks) {
  const rows = []

  for (const block of blocks) {
    for (const domain of block.domains) {
      for (const competency of domain.competencies) {
        rows.push({
          block_id: block.id,
          block_name: block.name,
          domain_name: domain.name,
          competency_id: competency.id,
          name: competency.name,
          weight: Number(competency.weight),
          criterion: competency.level_criterion,
        })
      }
    }
  }

  return rows
}

function getBlockWeightSum(competencyRows, blockId) {
  return competencyRows
    .filter((row) => row.block_id === blockId)
    .reduce((sum, row) => sum + row.weight, 0)
}

async function loadExportData(cycle_id) {
  const cycleResult = await getCycleById({ id: cycle_id })

  if (!cycleResult.rowCount) {
    const error = new Error('Цикл оценки не найден')
    error.code = 'CYCLE_NOT_FOUND'
    throw error
  }

  const cycle = cycleResult.rows[0]
  const catalog = await getFullCatalogByCatalogId({ catalog_id: cycle.catalog_id })
  const competencyRows = flattenCompetencies(catalog.blocks)
  const totalWeight = competencyRows.reduce((sum, row) => sum + row.weight, 0)

  const usersResult = await pool.query(
    `SELECT id, full_name FROM users WHERE team_id = $1 ORDER BY full_name`,
    [cycle.team_id]
  )

  const users = []
  for (const user of usersResult.rows) {
    const [assessmentsResult, aggregates] = await Promise.all([
      getAssessmentsByCycleAndUser({ cycle_id, user_id: user.id }),
      calculateUserAggregates({ cycle_id, user_id: user.id }),
    ])

    users.push({
      id: user.id,
      full_name: user.full_name,
      assessmentMap: new Map(
        assessmentsResult.rows.map((item) => [item.competency_id, item])
      ),
      aggregates,
    })
  }

  return {
    cycle,
    catalog,
    competencyRows,
    totalWeight,
    users,
  }
}

function buildAssessmentSheet(workbook, data) {
  const sheet = workbook.addWorksheet('Оценка_сотрудников')
  const header = [
    'Блок',
    'Домен компетенции',
    'Компетенция',
    'Вес',
    'Критерий уровня 2–3 \nПодтверждение',
  ]

  for (const user of data.users) {
    header.push(`${user.full_name}\nБалл (0–3)`)
    header.push(`${user.full_name}\nДоказательства/примеры`)
  }

  sheet.addRow(header)

  for (const competency of data.competencyRows) {
    const row = [
      competency.block_name,
      competency.domain_name,
      competency.name,
      competency.weight,
      competency.criterion,
    ]

    for (const user of data.users) {
      const assessment = user.assessmentMap.get(competency.competency_id)
      row.push(assessment?.score ?? null)
      row.push(assessment?.evidence ?? null)
    }

    sheet.addRow(row)
  }

  sheet.getRow(1).font = { bold: true }
  sheet.columns.forEach((column) => {
    column.width = 22
  })
}

function buildSummarySheet(workbook, data) {
  const sheet = workbook.addWorksheet('Итоги')
  sheet.addRow([
    'Сотрудник',
    'Σ весов (всего)',
    'Взвешенный вес (Σ весов оценённых)',
    'Оценено компетенций',
    'Всего компетенций',
    '% заполнения',
    'Сумма(балл*вес)',
    'Взвешенный итог (0–3)',
    'Невзвешенная средняя (0–3)',
  ])

  for (const user of data.users) {
    const { aggregates } = user
    sheet.addRow([
      user.full_name,
      data.totalWeight,
      aggregates.weight_scored,
      aggregates.scored_count,
      aggregates.total_count,
      aggregates.fill_rate,
      aggregates.weighted_sum,
      aggregates.weighted_total,
      aggregates.unweighted_avg,
    ])
  }

  sheet.getRow(1).font = { bold: true }
}

function buildBlockSummarySheet(workbook, data) {
  const sheet = workbook.addWorksheet('Итоги_по_блокам')
  const header = ['Блок', 'Σ весов (в блоке)']

  for (const user of data.users) {
    header.push(`${user.full_name} — Взвешенный вес`)
    header.push(`${user.full_name} — Σ(балл*вес)`)
    header.push(`${user.full_name} — Взвешенный итог`)
  }

  sheet.addRow(header)

  for (const block of data.catalog.blocks) {
    const row = [block.name, getBlockWeightSum(data.competencyRows, block.id)]

    for (const user of data.users) {
      const blockAggregate = user.aggregates.blocks.find((item) => item.block_id === block.id)
      row.push(blockAggregate?.weight_scored ?? null)
      row.push(blockAggregate?.weighted_sum ?? null)
      row.push(blockAggregate?.weighted_total ?? null)
    }

    sheet.addRow(row)
  }

  sheet.getRow(1).font = { bold: true }
}

exports.exportCycleToBuffer = async (params) => {
  const { cycle_id } = params
  const data = await loadExportData(cycle_id)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Grow App'
  workbook.created = new Date()

  buildAssessmentSheet(workbook, data)
  buildSummarySheet(workbook, data)
  buildBlockSummarySheet(workbook, data)

  const buffer = await workbook.xlsx.writeBuffer()
  return {
    buffer,
    filename: `competency-matrix-${data.cycle.name.replace(/[^\w\-]+/g, '_')}.xlsx`,
  }
}

exports.loadExportData = loadExportData
