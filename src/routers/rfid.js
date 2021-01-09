const express = require('express');
const router = new express.Router();
const Room = require('../models/room');
const Tag = require('../models/rfid');
const People = require('../models/people');
const LoggedInTagsLog = require('../models/logged_in_tags_log');

const EventEmitter = require('../EventEmitter');

const logPeopleAmount = (room) => {
    const today = new Date();

    People.countDocuments({ roomId: room._id, createdAt: { $gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())}}, async (err, count) => {
        const newTagLog = new LoggedInTagsLog({peopleAmount: count, roomId: room._id, levelId: room.levelId});
        await newTagLog.save();
    });
}

router.get('/rfid/tagid/:appId', async (req, res) => {
    try {
        const {appId} = req.params;

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
        // TODO: ook uit people verwijderen
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

router.post('/rfid/login', async (req, res) => {
    try {
        let { value, roomid } = req.body; // value = tagId

        if(typeof value === "number") {
            value = value.toString();
        }

        const room = await Room.findOne({roomId: roomid});
        const tag = await Tag.findOne({tagId: value});

        if(!tag) {
            res.status(400).send({message: 'Tag niet gekoppeld'});
            return false
        }

        if(!room) {
            res.status(400).send({message: 'Ruimte bestaat niet'});
            return false
        }

        const existingLogin = await People.findOne({tagId: tag._id}).populate('roomId');
        if(existingLogin) {
            await People.deleteOne({tagId: tag._id});

            // Als de gebruiker in een ander lokaal inlogt wordt de log van het oude lokaal ook opgeslagen
            if(room.roomId !== existingLogin.roomId.roomId) {
                logPeopleAmount(existingLogin.roomId)
            }
        }

        const newLogin = new People({tagId: tag._id, roomId: room._id, roomName: room.roomName, levelId: room.levelId});

        await newLogin.save();

        // Sla het aantal mensen op dat in het lokaal is
        logPeopleAmount(room);

        EventEmitter.emit('new-login', {eventAppId: tag.appId, tagId: tag._id});

        res.send({existingLogin, newLogin});
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.post('/rfid/logout', async (req, res) => {
    try {
        const { value } = req.body;

        const tag = await Tag.findOne({tagId: value});

        if(!tag) {
            res.status(400).send({message: 'Tag niet gekoppeld'});
            return false
        }

        const existingLogin = await People.findOne({tagId: tag._id}).populate('roomId');
        if(existingLogin) {
            await People.deleteOne({tagId: tag._id});

            logPeopleAmount(existingLogin.roomId)
        }

        EventEmitter.emit('new-login', {eventAppId: tag.appId, tagId: tag._id});

        res.send({message: "Success"});
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

module.exports = router;
