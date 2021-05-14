var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var WorkSessionSchema = new Schema({
  index : Number,
  scheduledStartingTimestamp : Date,
  realStartingTimestamp : Date,
  targetDuration : Number,
  missions : [String],
  comments : String,
  rating : Number,
  afterStats : {
      duration : Number,
      feelingRating : Number,
      comments : String
  }
});

module.exports = mongoose.model('WorkSession', WorkSessionSchema );