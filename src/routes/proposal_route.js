const express = require('express')
const router = express.Router()

const secure = require('../models/secure')
const proposal_controller = require('../controllers/proposal_controller')

/** send with user's token in the request header */ 

// post a new proposal
router.post('/', secure.verify, proposal_controller.post_proposal)

// debate on a proposal: vote and comment
router.post('/:proposal_id/debate', secure.verify, proposal_controller.debate_proposal)

// return a proposal
router.get('/:proposal_id', proposal_controller.get_proposal)

// upvote for a debate
router.post('/:proposal_id/debate/:debate_id/upvote', secure.verify, proposal_controller.upvote)

module.exports = router