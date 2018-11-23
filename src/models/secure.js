// jsonwebtoken
const jwt = require('jsonwebtoken')
const token_expiration = 3600
const secret_code = 'InfinitoPhoenix'

// encrypt the password
const bcrypt = require('bcrypt')
const saltRounds = 10

exports.encrypt = function(raw) {
  return bcrypt.hashSync(raw, saltRounds)
}

exports.compare = function(raw, hash) {
  console.log(raw, ' ', hash)
  return bcrypt.compareSync(raw, hash)  
}

exports.create_token = function(user_id) {
  return jwt.sign({
    user_id, expiresIn: token_expiration
  }, secret_code, {
    expiresIn: token_expiration
  })
}
