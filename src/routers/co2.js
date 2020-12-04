const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const Co2 = require('../models/co2');
const Room = require('../models/room');

const EventEmitter = require('../EventEmitter');

router.get('/co2', (req, res) => {
    res.send({value: 1200});
});

router.post('/co2add', async (req, res) => {
    try {
        const { value, roomId } = req.body;

        const room = await Room.findOne({roomId});

        const newValue = new Co2({value: value, roomId: room._id});

        await newValue.save();

        EventEmitter.emit('update-status', {roomId});

        await newValue.save();

        console.log(value);

        res.send(newValue);
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

module.exports = router;
