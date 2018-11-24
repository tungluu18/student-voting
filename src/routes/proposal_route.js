const express = require('express')
const router = express.Router()

const secure = require('../models/secure')
const proposal_controller = require('../controllers/proposal_controller')

/** send with user's token in the request header */ 

// return proposals
router.get('/', proposal_controller.getAll)

// return a proposal
router.get('/:proposal_id', proposal_controller.get)

// post a new proposal: content
router.post('/', secure.verify, proposal_controller.post)

// debate on a proposal: vote and comment
router.post('/:proposal_id/debate', secure.verify, proposal_controller.debate)

// delete debate
router.delete('/:proposal_id/debate/', secure.verify, proposal_controller.delete_debate)

// delete a proposal
router.delete('/:proposal_id', secure.verify, proposal_controller.delete)

// upvote for a debate
router.put('/:proposal_id/debate/:debate_id/upvote', secure.verify, proposal_controller.upvote)

// downvote for a debate
router.put('/:proposal_id/debate/:debate_id/downvote', secure.verify, proposal_controller.downvote)

module.exports = router