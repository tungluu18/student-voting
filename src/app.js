const express = require('express')
const app = express()

// mongoDB connection
const mongoose = require('mongoose')
const mongodb_url = 'mongodb://user:a123456@ds115434.mlab.com:15434/student-voting'
mongoose.connect(process.env.MONGODB_URI || mongodb_url)
mongoose.Promise = global.Promise
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error: '))

// middleware parsing request
const bodyParser = require('body-parser')
app.use(bodyParser.json())  

// static folder for images
app.use(express.static('resources/images'))  

// CORS stuffs
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  next()
})

/** set up routing file */

const UserRouter = require('./routes/user_route')
app.use('/user', UserRouter)

const ProposalRouter = require('./routes/proposal_route')
app.use('/proposal', ProposalRouter)

// listen on port
const port = 12345
app.listen(port, () => { 
  console.log(`Server is listening on port ${port}...`)
})
  
