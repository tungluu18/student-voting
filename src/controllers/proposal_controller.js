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

exports.post = async function(req, res) {  
  const {content} = req.body
  const publisher_id = secure.decode(req.headers['token'])
  const proposal = new Proposal({publisher_id, content})
  try {
    const new_proposal = await proposal.save()
    sendResponse(res, 200, {proposal_id: new_proposal._id})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.delete = async function(req, res) {
  const {proposal_id} = req.params
  const user_id = secure.decode(req.headers['token'])  
  try {
    const proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal')
    if (proposal.publisher_id != user_id) throw new Error('Cannot delete this proposal')
    await Proposal.findByIdAndRemove(proposal_id)
    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.debate = async function(req, res) {
  const {proposal_id} = req.params  
  const {type, comment} = req.body
  const debator_id = secure.decode(req.headers['token'])  
  try {        
    let proposal = await Proposal.findById(proposal_id)
    
    // user is allowed to debate only once on each proposal
    let filter = proposal.debates.filter(x => x.debator_id == debator_id)
    if (filter.length > 0) throw new Error('User has already debated on this proposal')

    // push new debate into proposal's debate list
    let a = [...proposal.debates, ...[{debator_id, type, comment}]]
    await Proposal.findByIdAndUpdate({_id: proposal_id}, {debates: a})

    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.get = async function(req, res) {
  const {proposal_id} = req.params
  try {
    const proposal = await Proposal.findById(proposal_id)
    sendResponse(res, 200, proposal)
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.getByPublisherId = async function(req, res) {
  const {publisher_id} = secure.decode(req.headers['token'])
  try {
    const proposals = await Proposal.find({publisher_id})
    sendResponse(res, 200, proposals)
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.getAll = async function(req, res) {
  try {
    const proposals = await Proposal.find()
    sendResponse(res, 200, proposals)
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

check = function (debate, up_or_down, user_id) {
  return debate[up_or_down].find(x => x == user_id) != null
}

remove_vote = function(debate, up_or_down, user_id) {
  return debate[up_or_down].filter(x => x != user_id)
}

add_vote = function(debate, up_or_down, user_id) {
  return [...debate[up_or_down], ...[user_id]]
}

exports.upvote = async function(req, res) {
  const user_id = secure.decode(req.headers['token'])
  const {proposal_id, debate_id} = req.params

  try {
    // find the proposal by id
    let proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal')

    // find the dabate on that proposal by id
    let debates = proposal.debates    
    let debate = debates.find(x => x._id == debate_id)
    if (debate == null) throw new Error('Invalid debate')
            
    if (check(debate, 'downvoter_id', user_id)) 
      debate.downvoter_id = remove_vote(debate, 'downvoter_id', user_id)      
    
    if (check(debate, 'upvoter_id', user_id)) {
      // remove upvoter
      debate.upvoter_id = remove_vote(debate, 'upvoter_id', user_id)
    } else {
      // add upvoter
      debate.upvoter_id = add_vote(debate, 'upvoter_id', user_id)
    }
    debates = debates.map(x => x._id == debate_id ? debate : x)
    await Proposal.findByIdAndUpdate(proposal_id, {debates})
    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }  
}

exports.downvote = async function(req, res) {
  const user_id = secure.decode(req.headers['token'])
  const {proposal_id, debate_id} = req.params

  try {
    // find the proposal by id
    let proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal')

    // find the dabate on that proposal by id
    let debates = proposal.debates    
    let debate = debates.find(x => x._id == debate_id)
    if (debate == null) throw new Error('Invalid debate')
        
    if (check(debate, 'upvoter_id', user_id)) 
      debate.upvoter_id = remove_vote(debate, 'upvoter_id', user_id)      
    
    if (check(debate, 'downvoter_id', user_id)) {
      // remove upvoter
      debate.downvoter_id = remove_vote(debate, 'downvoter_id', user_id)
    } else {
      // add upvoter
      debate.downvoter_id = add_vote(debate, 'downvoter_id', user_id)
    }
    debates = debates.map(x => x._id == debate_id ? debate : x)
    await Proposal.findByIdAndUpdate(proposal_id, {debates})
    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }  
}

exports.delete_debate = async function(req, res) {
  const user_id = secure.decode(req.headers['token'])
  const {proposal_id} = req.params

  // delete debate of user[user_id] on proposal[proposal_id]
  try {
    const proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal_id')
    
    let debates = proposal.debates    
    console.log(user_id, debates)
    if (!debates.find(x => x.debator_id == user_id)) throw new Error('Cannot delete debate on this proposal')

    for (var i = 0; i < debates.length; ++i) {
      if (debates[i].debator_id == user_id) {
        debates.splice(i, 1)
        break
      }
    }    
    await Proposal.findByIdAndUpdate(proposal_id, {debates})
    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}