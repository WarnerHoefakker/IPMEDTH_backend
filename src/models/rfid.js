const mongoose = require('../db/mongoose');

const rfidSchema = mongoose.Schema({
    value: {
        type: String,
        required: true
    },
    roomid: {
        type: Number,
        // required: true
    }
},{timestamps:true});

const RFID = mongoose.model('RFID', rfidSchema);

module.exports = RFID;
