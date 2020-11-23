const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const RFID = require('../models/rfid');

router.get('/rfid', (req, res) => {
    res.send({tag: 'id123'});
});

router.post('/rfid-add', async (req, res) => {
    const { uid } = req.body;

    const newValue = new RFID({uid: "",roomid:0});

    await newValue.save();
    // const level = await Co2.find({});
    console.log(req.body);
    console.log(uid);
    res.send({value: 894353434});
});

module.exports = router;
