const { getOrgSummary } = require('../services/orgSummaryService')

exports.getOrgSummary = async (req, res) => {
  try {
    const summary = await getOrgSummary(req.user)
    res.status(200).json(summary)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
