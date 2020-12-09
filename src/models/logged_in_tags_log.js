const mongoose = require('../db/mongoose');

const loggedInTagsLogSchema = mongoose.Schema({
    peopleAmount: {
        type: Number,
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    levelId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Level'
    }

},{timestamps:true});

const LoggedInTagsLog = mongoose.model('LoggedInTagsLog', loggedInTagsLogSchema);

module.exports = LoggedInTagsLog;