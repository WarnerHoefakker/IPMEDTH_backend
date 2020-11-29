const mongoose = require('../db/mongoose');

const rfidSchema = mongoose.Schema({
    value: {
        type: Number,
        required: true
    },
    roomid: {
        type: Number,
        required: false
    }
},{timestamps:true});

const RFID = mongoose.model('RFID', rfidSchema);

module.exports = RFID;
