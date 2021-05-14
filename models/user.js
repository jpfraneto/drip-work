const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email : {
        type: String,
        required: true,
        unique: true
    },
    music: [{
        type : Schema.Types.ObjectId, 
        ref : 'MusicRecommendation'
    }],
    days : [{
        type: Schema.Types.ObjectId, 
        ref: 'Day'
    }],
    workSessions : [{
        type: Schema.Types.ObjectId, 
        ref: 'WorkSession'
    }],
    topics : [String],
    elapsedTimeWorking : { type: Number, default: 0 }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);