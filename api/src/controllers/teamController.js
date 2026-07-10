const {
  getAllTeams,
  createTeam,
  isTeamNameTaken,
} = require('../services/teamService')

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
