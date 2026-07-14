const { checkIsUserExist, createUser, updateUser, deleteUser, getUsersByScope } = require('../services/userService')
const { getUserCycleHistory } = require('../services/userCycleHistoryService')
const { canViewUser } = require('../middleware/canAssess')



const VALID_GRADES = ['junior', 'middle', 'senior']



function parseGradeValue(grade) {
  if (grade === null || grade === undefined || grade === '') {
    return { ok: true, value: null }
  }

  if (VALID_GRADES.includes(grade)) {
    return { ok: true, value: grade }
  }

  return { ok: false }
}

function validateGradeForRole(role, grade) {
  const parsed = parseGradeValue(grade)

  if (!parsed.ok) {
    return { error: 'Недопустимый грейд. Допустимые значения: junior, middle, senior' }
  }

  if (role === 'user' && !parsed.value) {
    return { error: 'Грейд обязателен для роли сотрудника' }
  }

  return { grade: parsed.value }
}



function normalizeJobTitle(job_title) {

  if (job_title === undefined || job_title === null || job_title === '') return null

  const trimmed = String(job_title).trim()

  if (!trimmed) return null

  return trimmed.slice(0, 150)

}



function normalizeManagedTeamIds(managed_team_ids) {

  if (!Array.isArray(managed_team_ids)) return []

  return managed_team_ids.filter((id) => typeof id === 'string' && id.length > 0)

}



exports.getUsers = async (req, res) => {

  try {

    const result = await getUsersByScope(req.user)



    res.status(200).json(result.rows)

  } catch (err) {

    res.status(500).json({ error: err.message })

  }

}



exports.getUserCycleHistory = async (req, res) => {

  const { userId } = req.params



  try {

    const allowed = await canViewUser(req.user, userId)

    if (!allowed) {

      return res.status(403).json({ error: 'Нет доступа к истории циклов пользователя' })

    }



    const history = await getUserCycleHistory(userId)

    res.status(200).json(history)

  } catch (err) {

    res.status(500).json({ error: err.message })

  }

}



exports.createAdmin = async (req, res) => {

  const login = 'admin'

  const password = 'admin'

  const full_name = 'admin'

  const phone = 'admin'

  const email = 'admin'

  const role = 'admin'

  try {

    const isUserExist = await checkIsUserExist({ login })



    if (isUserExist) {

      res.status(409).json({ error: 'Администратор уже существует' })

    } else {

      const result = await createUser({ login, password, full_name, phone, email, role })



      res.status(201).json(result.rows[0])

    }

  }

  catch (err) {

    res.status(500).json({ error: err.message })

  }

}



exports.createUser = async (req, res) => {

  const login = req.body.login || ''

  const password = req.body.password || ''

  const full_name = req.body.full_name || ''

  const phone = req.body.phone || ''

  const email = req.body.email || ''

  const role = req.body.role || 'user'

  const team_id = req.body.team_id || null

  const job_title = normalizeJobTitle(req.body.job_title)

  const managed_team_ids = normalizeManagedTeamIds(req.body.managed_team_ids)

  const gradeResult = validateGradeForRole(role, req.body.grade)

  if (gradeResult.error) {
    return res.status(400).json({ error: gradeResult.error })
  }



  try {

    const isUserExist = await checkIsUserExist({ login })



    if (isUserExist) {

      res.status(409).json({ error: 'Пользователь уже существует' })

    } else {

      const result = await createUser({

        login, password, full_name, phone, email, role, team_id, grade: gradeResult.grade, job_title, managed_team_ids,

      })



      res.status(201).json(result.rows[0])

    }

  }

  catch (err) {

    res.status(500).json({ error: err.message })

  }

}



exports.updateUser = async (req, res) => {

  const { id } = req.params

  const full_name = req.body.full_name || ''

  const email = req.body.email || ''

  const phone = req.body.phone || ''

  const role = req.body.role || 'user'

  const team_id = req.body.team_id || null

  const job_title = normalizeJobTitle(req.body.job_title)

  const managed_team_ids = normalizeManagedTeamIds(req.body.managed_team_ids)

  const gradeResult = validateGradeForRole(role, req.body.grade)

  if (gradeResult.error) {
    return res.status(400).json({ error: gradeResult.error })
  }



  try {

    const result = await updateUser({

      id, full_name, email, phone, role, team_id, grade: gradeResult.grade, job_title, managed_team_ids,

    })



    if (!result.rowCount) {

      return res.status(404).json({ error: 'Пользователь не найден' })

    }



    res.status(200).json(result.rows[0])

  } catch (err) {

    res.status(500).json({ error: err.message })

  }

}



exports.deleteUser = async (req, res) => {

  const { id } = req.params

  try {

    const result = await deleteUser({ id })



    res.status(204).send(result.rows[0])

  } catch (err) {

    res.status(500).json({ error: err.message })

  }

}

