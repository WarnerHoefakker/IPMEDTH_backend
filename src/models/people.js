const mongoose = require('../db/mongoose');

const roomSchema = mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    roomName: {
        type: String,
        required: true
    },
    levelId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Level'
    },
    tagId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tag',
        unique: true
    }
},{timestamps:true});

const People = mongoose.model('People', roomSchema);

module.exports = People;
