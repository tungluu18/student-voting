const mongoose = require('mongoose')
const Schema = mongoose.Schema

let UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  displayname: String,
  email: String,
  address: String,
  key: String
})

module.exports = mongoose.model('User', UserSchema)