const UserModel = require('../models/user_model')
const Neon = require('../neonjs/index')

const secure = require('../models/secure')

function sendResponse(res, status, payload) {
  res.status(status)
  data = {
    success: status == 200 ? "true" : "false",
    payload: payload
  }
  res.send(data)
}

exports.getUserById = async function(user_id) {  
  try {
    let user = await UserModel.findById(user_id)
    if (!user) throw new Error('Invalid user_id')
    user.password = user._v = undefined
    user.token = await Neon.balanceOf(user.address)
    return user 
  } catch (error) {
    console.log(error)
  }
}

exports.authenticate = async function(req, res) {  
  const {username, password} = req.query
  console.log('login', ' ', username, ' ', password)
  try {
    let user = await UserModel.findOne({username})            
    if (user == null) throw new Error('Invalid username')    
    if (!password || !secure.compare(password, user.password)) throw new Error('Wrong password')    
    let result = await exports.getUserById(user._id)    
    sendResponse(res, 200, {token: secure.create_token(user._id), user: result})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }  
}

exports.create = async function(req, res) {
  let {username, password, displayname, email} = req.body
  if (!username || !password) {
    sendResponse(res, 404, {Error: 'Invalid username and password'})
    return 
  }
  
  const user = new User({username: username, password: secure.encrypt(password), displayname: displayname, email: email})
  try {
    const check_user = await UserModel.findOne({username})
    if (check_user != null) 
      sendResponse(res, 404, {Error: 'The username has been used!!!'})      
    else {
      const new_user = await user.save()
      sendResponse(res, 200, {user_id: new_user._id})  
    }     
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.update = async function(req, res) {
  const user_id = secure.decode(req.headers['authorization'])
  try {
    await UserModel.findByIdAndUpdate(user_id, req.body)
    sendResponse(res, 200, {})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.getBalance = async function(req, res) {
  try {
    const result = await Neon.balanceOf(req.params.address)
    sendResponse(res, 200, result)  
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }        
}

exports.getTime = async function(req, res) {
  try {
    const result = await Neon.getTime()
    sendResponse(res, 200, result)
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }
}

exports.minus_token = async function(user_id, amount) {
  try {
    const user = await UserModel.findById(user_id)
    if (!user) throw new Error('Invalid user_id')    
    const current_balance = await Neon.balanceOf(user.address)
    const result = await Neon.setToken(user.address, current_balance - amount)
    return result
  } catch (error) {
    console.log(error)    
  }
}

exports.bonus_token = async function(user_id, amount) {
  try {
    const user = await UserModel.findById(user_id)
    if (!user) throw new Error('Invalid user_id')
    const current_balance = await Neon.balanceOf(user.address)
    const result = await Neon.setToken(user.address, current_balance + amount)
    return result
  } catch (error) {
    console.log(error)
  }
}

exports.set_token = async function(user_id, amount) {
  try {
    const user = await UserModel.findById(user_id)
    if (!user) throw new Error('Invalid user_id')    
    const result = await Neon.setToken(user.address, amount)
    return result
  } catch (error) {
    console.log(error)
  }
}