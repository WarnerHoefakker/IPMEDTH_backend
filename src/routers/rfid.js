const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const RFID = require('../models/rfid');

router.get('/rfid', (req, res) => {
    res.send({tag: 'id123'});
});

router.post('/rfidadd', async (req, res) => {
    const { value } = req.body;
    console.log(req.body);
    const newValue = new RFID({value: value, roomid: req.body.roomid});

    await newValue.save();
    // const level = await Co2.find({});

    console.log(value);
    res.send({value: 1200});
});

module.exports = router;
