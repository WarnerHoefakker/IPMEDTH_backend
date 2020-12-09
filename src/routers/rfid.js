const express = require('express');
const router = new express.Router();
const Room = require('../models/room');
const Tag = require('../models/rfid');
const People = require('../models/people');
const LoggedInTagsLog = require('../models/logged_in_tags_log');

const EventEmitter = require('../EventEmitter');

router.get('/rfid', (req, res) => {
    res.send({tag: 'id123'});
});

router.post('/rfid/add', async(req, res) => {
    try {
        const { value, appId } = req.body;

        const newTag = new Tag({tagId: value, appId});

        await newTag.save();

        res.send(newTag);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.post('/rfid/login', async (req, res) => { // TODO: 1 tag kan tegelijk in dezelfde of andere ruimtes inloggen
    try {
        const { value, roomid } = req.body;

        const room = await Room.findOne({roomId: roomid});
        const tag = await Tag.findOne({tagId: value});

        const addPerson = new People({rfidTag: tag._id, roomId: room._id, roomName: req.body.roomid, levelId: room.levelId});

        await addPerson.save();

        People.countDocuments({ roomId: room._id }, async (err, count) => {
            const newTagLog = new LoggedInTagsLog({peopleAmount: count, roomId: room._id, levelId: room.levelId});
            await newTagLog.save();
        });

        EventEmitter.emit('update-status', {roomId: room.roomId});

        res.send(addPerson);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/rfidall', async (req, res) => {

    const level = await Tag.find({});

    for (i = 0; i < level.length; i++) {
      if (level[i].value == 559494754261) {
        Tag.deleteOne({ tagId: 559494754261 }, function (err) {
          if (err) return console.log(err);
        });
      }
    }


    res.send(level);
});

module.exports = router;
