const { getUserByLogin, getUserProfile } = require('../services/userService')
const { getToken } = require('../services/authService')

exports.login = async (req, res) => {
  const { login, password } = req.body

  const user = await getUserByLogin({ login })
  const isUserExist = user.rowCount

  if (isUserExist) {
    try {
      const userPassHash = user.rows?.[0].password
      const userId = user.rows[0].id
      const userRole = user.rows[0].role
      const token = await getToken({ userId, userRole, userPassHash, password })

      if (token) {
        const profile = await getUserProfile({ id: userId })
        res.status(200).header("auth-token", token).json({ token, user: profile })
      } else {
        res.status(401).json({ error: 'Логин или пароль введен неверно' })
      }

    } catch (err) {
      console.error(err)

      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(409).json({ error: 'Пользователь не существует' })
  }
}

exports.auth_me = async (req, res) => {
  try {
    const { id } = req.user

    const profile = await getUserProfile({ id })
    if (profile) {
      res.status(200).json(profile)
    } else {
      res.status(401).json({ error: 'Пользователь не авторизован' })
    }

  } catch (err) {
    console.error(err)

    res.status(500).json({ error: err.message })
  }

}
