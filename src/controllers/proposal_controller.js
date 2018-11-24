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

exports.upvote = async function(req, res) {
  const {proposal_id, debate_id} = req.params
  const user_id = secure.decode(req.headers['token'])

  try {
    // find the proposal by id
    let proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal')

    // find the dabate on that proposal by id
    let debates = proposal.debates    
    let debate = debates.find(x => x._id == debate_id)
    if (debate == null) throw new Error('Invalid debate')
    
    // check the list of upvoter on the debate    
    if (debate.upvoter_id.find(x => x == user_id) != null) 
      throw new Error('User can upvote only once on each debate')

    for (var _debate of proposal.debates) {      
      if (_debate._id == debate_id) {        
        // append this user to the list of upvoter
        _debate.upvoter_id.push(user_id)
        break
      }
    }         
            
    await Proposal.findByIdAndUpdate({_id: proposal_id}, {debates})
    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }  
}