const Proposal = require('../models/proposal_model')
const secure = require('../models/secure')

function sendResponse(res, status, payload) {
  res.status(status)
  data = {
    success: status == 200 ? "true" : "false",
    payload: payload
  }
  res.send(data)
}

exports.post_proposal = async function(req, res) {  
  const {content} = req.body
  const proposal = new Proposal({content})
  try {
    const new_proposal = await proposal.save()
    sendResponse(res, 200, {proposal_id: new_proposal._id})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.debate_proposal = async function(req, res) {
  const {proposal_id} = req.params  
  const {comment} = req.body
  const debator_id = secure.decode(req.headers['token'])  
  try {        
    let proposal = await Proposal.findById(proposal_id)
    
    // user is allowed to debate only once on each proposal
    let filter = proposal.debates.filter(x => x.debator_id == debator_id)
    if (filter.length > 0) throw new Error('User has already debated on this proposal')

    // push new debate into proposal's debate list
    let a = [...proposal.debates, ...[{debator_id, comment}]]
    await Proposal.findByIdAndUpdate({_id: proposal_id}, {debates: a})

    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.get_proposal = async function(req, res) {
  const {proposal_id} = req.params
  try {
    const proposal = await Proposal.findById(proposal_id)
    sendResponse(res, 200, proposal)
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}