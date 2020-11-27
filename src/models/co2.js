const mongoose = require('../db/mongoose');

const co2Schema = mongoose.Schema({
    value: {
        type: Number,
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Level'
    }
},{timestamps:true});

const Co2 = mongoose.model('Co2', co2Schema);

module.exports = Co2;