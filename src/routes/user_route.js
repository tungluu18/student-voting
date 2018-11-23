const express = require('express')
const router = express.Router()

const user_controller = require('../controllers/user_controller')


router.get('/auth', user_controller.authenticate)  // GET /auth?username=&password=
router.post('/reg', user_controller.create)

module.exports = router