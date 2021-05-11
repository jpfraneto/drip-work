var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var MusicSchema = new Schema({
    youtubeID : String,
    duration : Number,
    dateUploaded : Date,
    timesPlayed : Number
});

module.exports = mongoose.model('Music', MusicSchema );