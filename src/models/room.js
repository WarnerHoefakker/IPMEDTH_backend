const mongoose = require('../db/mongoose');

const roomSchema = mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    roomName: {
        type: String,
        required: true,
        unique: true
    },
    levelId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Level'
    },
    peopleAmount: {
        type: Number,
        required: true
    }

},{timestamps:true});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;