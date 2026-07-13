const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { getManagedTeamIds } = require('./managedTeamsService')
require('dotenv').config()

exports.getToken = async (params) => {
  const { userId, userRole, userPassHash, password } = params

  const validPass = await bcrypt.compare(password, userPassHash)

  if (!validPass) return null

  const payload = { id: userId, role: userRole }
  if (userRole === 'lead') {
    payload.managed_team_ids = await getManagedTeamIds(userId)
  }
  const token = jwt.sign(payload, process.env.TOKEN_SECRET)

  return token
}
