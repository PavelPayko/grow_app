const pool = require('../config/db')
const bcrypt = require("bcryptjs")

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
    `SELECT u.id, u.role, u.login, u.full_name, u.phone, u.email, u.team_id, u.grade,
            t.name AS team_name
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     WHERE u.id = $1`,
    [id]
  )

  return result
}

exports.getAllUsers = async () => {
  const result = await pool.query(
    `SELECT u.created_at, u.email, u.full_name, u.id, u.login, u.phone, u.role,
            u.team_id, u.grade, t.name AS team_name
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     ORDER BY u.full_name`
  )

  return result
}

exports.createUser = async (params) => {
  const { login, password, full_name, phone, email, role, team_id, grade } = params
  const userGrade = grade || 'junior'
  const salt = await bcrypt.genSalt(10)
  const password_hash = await bcrypt.hash(password, salt)
  const result = await pool.query(
    `INSERT INTO users (login, password, full_name, phone, email, role, team_id, grade)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, login, full_name, phone, email, role, team_id, grade, created_at`,
    [login, password_hash, full_name, phone, email, role, team_id || null, userGrade]
  )

  return result
}

exports.updateUser = async (params) => {
  const { full_name, email, phone, role, team_id, grade, id } = params
  const userGrade = grade || 'junior'

  const result = await pool.query(
    `UPDATE users
     SET full_name = $1, email = $2, phone = $3, role = $4, team_id = $5, grade = $6
     WHERE id = $7
     RETURNING id, login, full_name, phone, email, role, team_id, grade, created_at`,
    [full_name, email, phone, role, team_id || null, userGrade, id]
  )

  return result
}

exports.deleteUser = async (params) => {
  const { id } = params

  const result = await pool.query('DELETE FROM users WHERE id = $1', [id])

  return result
}