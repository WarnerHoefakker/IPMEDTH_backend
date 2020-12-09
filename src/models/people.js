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
    rfidTag: {
        type: Number,
        required: true
    }
},{timestamps:true});

const People = mongoose.model('People', roomSchema);

module.exports = People;
