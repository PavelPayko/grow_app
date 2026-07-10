const { exportCycleToBuffer } = require('../services/competencyExcelExportService')
const { importAssessmentsFromBuffer } = require('../services/competencyExcelImportService')

function handleError(res, err) {
  if (err.code === 'CYCLE_NOT_FOUND') {
    return res.status(404).json({ error: err.message })
  }
  if (err.code === 'INVALID_XLSX') {
    return res.status(400).json({ error: err.message })
  }
  if (err.code === 'IMPORT_VALIDATION_FAILED') {
    return res.status(400).json({ error: err.message, details: err.details })
  }
  if (err.code === 'CYCLE_NOT_WRITABLE') {
    return res.status(403).json({ error: err.message })
  }
  return res.status(500).json({ error: err.message })
}

exports.exportCycle = async (req, res) => {
  try {
    const { buffer, filename } = await exportCycleToBuffer({
      cycle_id: req.params.cycleId,
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(Buffer.from(buffer))
  } catch (err) {
    handleError(res, err)
  }
}

exports.importCycle = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен. Используйте поле file' })
  }

  const import_catalog = req.body.import_catalog !== 'false'

  try {
    const result = await importAssessmentsFromBuffer({
      buffer: req.file.buffer,
      cycle_id: req.params.cycleId,
      assessed_by: req.user.id,
      import_catalog,
    })

    res.status(200).json({
      ...result,
      message: result.report.summary.has_warnings
        ? 'Импорт выполнен с предупреждениями — см. report'
        : 'Импорт выполнен успешно',
    })
  } catch (err) {
    handleError(res, err)
  }
}
