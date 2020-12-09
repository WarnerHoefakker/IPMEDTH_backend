const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const Room = require('../models/room');
const RFID = require('../models/rfid');
const People = require('../models/people');

router.get('/rfid', (req, res) => {
    res.send({tag: 'id123'});
});

router.post('/rfidadd', async (req, res) => {
    const { value } = req.body;

    const newValue = new RFID({value: value, roomid: req.body.roomid});

    const room = await Room.findOne({roomid: req.body.roomid});
    const addPerson = new People({rfidTag: req.body.value, roomid: req.body.roomid, roomName: req.body.roomid});

    await newValue.save();

    const level = await RFID.find({});
    res.send(level);
    console.log(value);
    console.log(req.body.roomid);
});

router.get('/rfidall', async (req, res) => {

    const level = await RFID.find({});

    for (i = 0; i < level.length; i++) {
      if (level[i].value == 559494754261) {
        RFID.deleteOne({ value: 559494754261 }, function (err) {
          if (err) return console.log(err);
        });
      }
    }


    res.send(level);
});

module.exports = router;
