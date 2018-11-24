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
  publisher_id: {
    type: String,
    maxlength: 50
  },
  debates: [DebateSchema]
})

module.exports = mongoose.model('Proposal', ProposalSchema)