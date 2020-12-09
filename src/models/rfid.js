const mongoose = require('../db/mongoose');

const rfidSchema = mongoose.Schema({
    tagId: {
        type: Number,
        required: true,
        unique: true
    },
    appId: {
        type: String,
        required: true
    },
    levelId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Level'
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Room'
    }
},{timestamps:true});

const Tag = mongoose.model('Tag', rfidSchema);

module.exports = Tag;
