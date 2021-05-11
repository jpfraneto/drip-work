var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var WorkSessionSchema = new Schema({
  index : Number,
  targetStartingTimestamp : Date,
  realStartingTimestamp : Date,
  targetDuration : Number,
  mission : String,
  rating : Number,
  afterStats : {
      duration : Number,
      feelingRating : Number,
      comments : String
  }
});

module.exports = mongoose.model('WorkSession', WorkSessionSchema );