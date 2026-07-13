const pool = require('../config/db')
const bcrypt = require("bcryptjs")
const { getManagedTeamIds, syncManagedTeamsForRole } = require('./managedTeamsService')

const USER_SELECT = `SELECT u.created_at, u.email, u.full_name, u.id, u.login, u.phone, u.role,
            u.team_id, u.grade, u.job_title, t.name AS team_name
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id`

async function attachManagedTeamIds(user) {
  if (!user) return user
  const managed_team_ids = user.role === 'lead'
    ? await getManagedTeamIds(user.id)
    : []
  return { ...user, managed_team_ids }
}

exports.checkIsUserExist = async (params) => {
  const { login } = params
  const isUserExist = await pool.query('SELECT 1 FROM users WHERE login=$1', [login]).rowCount

  return isUserExist
}

exports.getUserByLogin = async (params) => {
  const { login } = params
  const result = await pool.query('SELECT id, role, password, full_name FROM users WHERE login=$1', [login])

  return result
}

exports.getUserById = async (params) => {
  const { id } = params
  const result = await pool.query(
    `SELECT u.id, u.role, u.login, u.full_name, u.phone, u.email, u.team_id, u.grade, u.job_title,
            t.name AS team_name
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     WHERE u.id = $1`,
    [id]
  )

  return result
}

exports.getUserProfile = async (params) => {
  const result = await exports.getUserById(params)
  if (!result.rowCount) return null
  return attachManagedTeamIds(result.rows[0])
}

exports.getAllUsers = async () => {
  const result = await pool.query(
    `${USER_SELECT}
     ORDER BY u.full_name`
  )

  return result
}

async function resolveLeadManagedTeamIds(actor) {
  if (Array.isArray(actor.managed_team_ids)) {
    return actor.managed_team_ids
  }
  return getManagedTeamIds(actor.id)
}

exports.getUsersByScope = async (actor) => {
  if (actor.role === 'admin') {
    return exports.getAllUsers()
  }

  if (actor.role === 'lead') {
    const managedTeamIds = await resolveLeadManagedTeamIds(actor)
    if (!managedTeamIds.length) {
      return pool.query(
        `${USER_SELECT}
         WHERE u.id = $1
         ORDER BY u.full_name`,
        [actor.id]
      )
    }

    return pool.query(
      `${USER_SELECT}
       WHERE u.team_id = ANY($1::uuid[]) OR u.id = $2
       ORDER BY u.full_name`,
      [managedTeamIds, actor.id]
    )
  }

  return pool.query(
    `${USER_SELECT}
     WHERE u.id = $1
     ORDER BY u.full_name`,
    [actor.id]
  )
}

exports.createUser = async (params) => {
  const { login, password, full_name, phone, email, role, team_id, grade, job_title, managed_team_ids } = params
  const userGrade = grade || 'junior'
  const salt = await bcrypt.genSalt(10)
  const password_hash = await bcrypt.hash(password, salt)
  const result = await pool.query(
    `INSERT INTO users (login, password, full_name, phone, email, role, team_id, grade, job_title)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, login, full_name, phone, email, role, team_id, grade, job_title, created_at`,
    [login, password_hash, full_name, phone, email, role, team_id || null, userGrade, job_title || null]
  )

  const user = result.rows[0]
  await syncManagedTeamsForRole(user.id, role, managed_team_ids)

  return { ...result, rows: [await attachManagedTeamIds(user)] }
}

exports.updateUser = async (params) => {
  const { full_name, email, phone, role, team_id, grade, job_title, managed_team_ids, id } = params
  const userGrade = grade || 'junior'

  const result = await pool.query(
    `UPDATE users
     SET full_name = $1, email = $2, phone = $3, role = $4, team_id = $5, grade = $6, job_title = $7
     WHERE id = $8
     RETURNING id, login, full_name, phone, email, role, team_id, grade, job_title, created_at`,
    [full_name, email, phone, role, team_id || null, userGrade, job_title || null, id]
  )

  if (result.rowCount) {
    await syncManagedTeamsForRole(id, role, managed_team_ids)
    return { ...result, rows: [await attachManagedTeamIds(result.rows[0])] }
  }

  return result
}

exports.deleteUser = async (params) => {
  const { id } = params

  const result = await pool.query('DELETE FROM users WHERE id = $1', [id])

  return result
}
