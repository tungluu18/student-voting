const Proposal = require('../models/proposal_model')
const secure = require('../models/secure')
const UserController = require('./user_controller')
const UserModel = require('../models/user_model')
const Neon = require('../neonjs/index')

function sendResponse(res, status, payload) {
  res.status(status)
  data = {
    success: status == 200 ? "true" : "false",
    payload: payload
  }
  res.send(data)
}

const close_proposal = async function(proposal_id) {
  try {
    const proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal_id')

    // mark proposal as expired
    await Proposal.findByIdAndUpdate(proposal_id, {status: 'Expired'})

    // refund token for publisher
    await UserController.bonus_token(proposal.publisher_id, proposal.exposed_token)

    // reward token
    const advocates = proposal.debates.filter(x => x.type == "Yes")
    const opponents = proposal.debates.filter(x => x.type == "No")

    if (advocates.length > opponents.length * 1.25) {
      // advocates win
      for (var a of advocates) {
        await UserController.bonus_token(a.debator_id, 2)
      }
    } else {
      // opponents win
      for (var a of opponents) {
        await UserController.minus_token(a.debator_id, 2)
      }
    }

    return true
  } catch (error) {
    console.log(error)
    return false
  } 
}

const is_expired = async function(proposal_id) {
  try {
    const proposal = await Proposal.findById(proposal_id)  
    if (proposal == null) throw new Error('Invalid proposal_id')
    // console.log(proposal)
    if (proposal.status == 'Expired') return true

    console.log('Expire Time', proposal.expire_time)
    console.log('Now', Date.now())
    if (Date.now() <= new Date(proposal.expire_time)) 
      return false
    else {
      await close_proposal(proposal_id)
      return true
    }    
  } catch (error) {
    console.log(error)
  }  
}

exports.post = async function(req, res) {  
  console.log('Post Proposal...')
  const {title, content, token} = req.body
  const publisher_id = secure.decode(req.headers['authorization'])  
  let proposal = new Proposal({publisher_id, content, title, exposed_token: token})

  // the number of day that the proposal expires in = the number of exposed token  
  const expires_in = token * 3600 * 24
  
  const parsedDate = new Date(Date.parse(proposal.upload_time))
  const expire_time = new Date(parsedDate.getTime() + 1000 * expires_in)
  
  proposal.expire_time = expire_time

  try {
    // get the address of ther publisher
    const user = await UserModel.findById(publisher_id)
    
    // get the balance of the publisher
    const balance = await Neon.balanceOf(user.address)
  
    console.log(balance)
    if (balance < parseInt(token)) {
      sendResponse(res, 404, {Error: 'Not enough token bro'})
      return
    }

    // minus token of publisher
    await UserController.minus_token(publisher_id, token)

    const new_proposal = await proposal.save()
    sendResponse(res, 200, {proposal_id: new_proposal._id})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.delete = async function(req, res) {
  const {proposal_id} = req.params
  const user_id = secure.decode(req.headers['authorization'])  
  try {
    const proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal')
    if (proposal.publisher_id != user_id) throw new Error('Cannot delete this proposal')    
    await Proposal.findByIdAndRemove(proposal_id)
  } catch (error) {    sendResponse(res, 200, {})

    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.debate = async function(req, res) {  
  const {proposal_id} = req.params
  const {comment} = req.body
  const type = req.body.yesChecked ? "Yes" : "No"  
  const debator_id = secure.decode(req.headers['authorization'])
  try {        
    let proposal = await Proposal.findById(proposal_id)
    if (proposal == null) throw new Error('Invalid proposal_id')

    if (await is_expired(proposal_id)) throw new Error('Expired Proposal. Cannot debate.')

    // user is allowed to debate only once on each proposal
    let filter = proposal.debates.filter(x => x.debator_id == debator_id)
    if (filter.length > 0) throw new Error('User has already debated on this proposal')

    // push new debate into proposal's debate list    
    let a = [...proposal.debates, ...[{debator_id: debator_id, type: type, comment: comment}]]
    await Proposal.findByIdAndUpdate({_id: proposal_id}, {debates: a})

    // minus 1 token when debate
    await UserController.minus_token(debator_id, 1)

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
  const {publisher_id} = secure.decode(req.headers['authorization'])
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
  const user_id = secure.decode(req.headers['authorization'])
  const {proposal_id, debate_id} = req.params

  try {
    // find the proposal by id
    let proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal')

    // check if proposal is expired
    if (await is_expired(proposal_id)) throw new Error('Expired proposal. Cannot upvote')

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
  const user_id = secure.decode(req.headers['authorization'])
  const {proposal_id, debate_id} = req.params

  try {
    // find the proposal by id
    let proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal')

    // check if proposal is expired
    if (await is_expired(proposal_id)) throw new Error('Expired proposal. Cannot downvote')

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
  const user_id = secure.decode(req.headers['authorization'])
  const {proposal_id} = req.params

  // delete debate of user[user_id] on proposal[proposal_id]
  try {
    const proposal = await Proposal.findById(proposal_id)
    if (!proposal) throw new Error('Invalid proposal_id')
    
    // check if proposal is expired
    if (await is_expired(proposal_id)) throw new Error('Expired proposal. Cannot delete debate')

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