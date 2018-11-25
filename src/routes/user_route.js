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

// classify user credit_score
router.get('/test/:address', user_controller.getBalance)
router.post('/test_set/:address/:amount', (req,res) => {
  user_controller.set_token(req.params.address, req.params.amount)
})
router.get('/getBalance', user_controller.getBalance)
// router.post('/minusToken', user_controller.minusToken)
module.exports = router