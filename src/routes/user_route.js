const express = require('express')
const router = express.Router()

const user_controller = require('../controllers/user_controller')
const secure = require('../models/secure')

// authenticate user: return token for user include user_id and expiresIn
router.get('/auth', user_controller.authenticate)  // GET /auth?username=&password=

// register new account: username and password
router.post('/reg', user_controller.create)

/** send with user's token in header */

// update profile: displayname, email, ... 
router.put('/', secure.verify, user_controller.update)

module.exports = router