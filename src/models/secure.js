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
  return bcrypt.compareSync(raw, hash)  
}

exports.create_token = function(user_id) {
  return jwt.sign({
    user_id, expiresIn: token_expiration
  }, secret_code, {
    expiresIn: token_expiration
  })
}

exports.verify = function(req, res, next) {
  const token = req.headers['token']
  if (!token) throw new Error('Forbidden bro')
  jwt.verify(token, secret_code, (err, auth_data) => {
    if (err) {
      res.sendStatus(403)
      return
    }
    next()
  })
}

exports.decode = function(token) {
  return jwt.decode(token, secret_code).user_id
}