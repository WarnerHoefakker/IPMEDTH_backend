const mongoose = require('../db/mongoose');

const co2Schema = mongoose.Schema({
    value: {
        type: Number,
        required: true
    },
    roomid: {
        type: Number,
        required: true
    }
},{timestamps:true});

const Co2 = mongoose.model('Co2', co2Schema);

module.exports = Co2;