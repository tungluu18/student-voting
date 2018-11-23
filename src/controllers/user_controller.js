const User = require('../models/user_model')

const secure = require('../models/secure')

function sendResponse(res, status, payload) {
  res.status(status)
  data = {
    success: status == 200 ? "true" : "false",
    payload: payload
  }
  res.send(data)
}

exports.authenticate = async function(req, res) {  
  const {username, password} = req.query
    
  try {
    const user = await User.findOne({username})        
    if (user == null) throw new Error('Invalid username')    
    if (!password || !secure.compare(password, user.password)) throw new Error('Wrong password')
    sendResponse(res, 200, {token: secure.create_token(user._id)})
  } catch (error) {
    console.log(error)
    sendResponse(res, 404, {Error: error.message})
  }  
}

exports.create = async function(req, res) {
  let {username, password} = req.body
  if (!username || !password) {
    sendResponse(res, 404, {Error: 'Invalid username and password'})
    return 
  }
  
  const user = new User({username: username, password: secure.encrypt(password)})
  try {
    const check_user = await User.findOne({username})
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