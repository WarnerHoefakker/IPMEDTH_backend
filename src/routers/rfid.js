const express = require('express');
const router = new express.Router();
const Room = require('../models/room');
const Tag = require('../models/rfid');
const People = require('../models/people');
const LoggedInTagsLog = require('../models/logged_in_tags_log');

const EventEmitter = require('../EventEmitter');

router.get('/rfid', async (req, res) => {
    try {
        const {appId} = req.body;

        const tag = await Tag.findOne({appId});

        if(tag) {
            res.send({tagId: tag.tagId});
        }
        else {
            res.status(404).send({message: 'Geen tag gekoppeld'})
        }
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

router.post('/rfid/add', async(req, res) => {
    try {
        let { tagId, appId } = req.body;

        if(typeof tagId === "number") {
            tagId = tagId.toString();
        }

        if(typeof appId === "number") {
            appId = appId.toString();
        }

        // Als de tag al gebruikt wordt door een andere app, kan deze niet gekoppeld worden
        const existingTag = await Tag.findOne({tagId});
        if(existingTag && existingTag.appId !== appId) {
            res.status(400).send({message: 'Tag is al in gebruik'});
            return false
        }

        // Als de app al gekoppeld is aan een tag wordt deze koppeling verwijderd
        const existingApp = await Tag.findOne({appId});
        if(existingApp) {
            await Tag.deleteOne({appId});
        }

        const newTag = new Tag({tagId, appId});
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
