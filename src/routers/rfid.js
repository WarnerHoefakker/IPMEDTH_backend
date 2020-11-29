const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const RFID = require('../models/rfid');

router.get('/rfid', (req, res) => {
    res.send({tag: 'id123'});
});

router.post('/rfidadd', async (req, res) => {
    const { value } = req.body;

    const newValue = new RFID({value: value, roomid: req.body.roomid});

    await newValue.save();

    const level = await RFID.find({});
    res.send(level);

    console.log(value);
    console.log(req.body.roomid);
});

router.get('/rfidall', async (req, res) => {

    const level = await RFID.find({});

    if (level.includes(559494754261)){
      console.log("JAAA");
    }

    res.send(level);
});

module.exports = router;
