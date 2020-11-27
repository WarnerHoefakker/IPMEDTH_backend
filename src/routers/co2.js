const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const Co2 = require('../models/co2');
const Room = require('../models/room');

router.get('/co2', (req, res) => {
    res.send({value: 1200});
});

router.post('/co2add', async (req, res) => {
    try {
        const { value, roomName } = req.body;

        const room = await Room.findOne({roomName});

        const newValue = new Co2({value: value, roomId: room._id});

        await newValue.save();

        console.log(value);

        res.send(newValue);
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

module.exports = router;
