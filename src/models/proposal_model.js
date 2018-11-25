const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DebateSchema = new Schema({
  type: String,
  debator_id: String,
  comment: {
    type: String,
    maxlength: 200
  },
  upvoter_id: [String],
  downvoter_id: [String]
})

const ProposalSchema = new Schema({
  content: {
    type: String,
    maxlength: 1000
  },
  title: {
    type: String,
    maxlength: 100
  },
  publisher_id: {
    type: String,
    maxlength: 50
  },
  debates: [DebateSchema],
  upload_time: {
    type: Date,
    default: Date.now
  },
  exposed_token: Number,
  expire_time: Date,
  status: {
    type: String,
    default: 'Voting'
  }
})

module.exports = mongoose.model('Proposal', ProposalSchema)