var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var DaySchema = new Schema({
    targetSessions: [{
        type : Schema.Types.ObjectId, 
        ref : 'WorkSession'
    }],
    sessionsSummary: [{
        type : Schema.Types.ObjectId, 
        ref : 'WorkSession'
    }]
},
{
    timestamps: true
}
);

module.exports = mongoose.model('Day', DaySchema );