var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var WorkSessionSchema = new Schema({
  index : Number,
  scheduledStartingTimestamp : Date,
  realStartingTimestamp : Date,
  targetDuration : Number,
  realDuration : Number,
  missions : [{mission:String, missionComments:String, completed:Boolean}],
  comments : String,
  rating : Number,
  afterStats : {
      completionrating : Number,
      feelingRating : Number,
      afterComments : String
  }
});

module.exports = mongoose.model('WorkSession', WorkSessionSchema );