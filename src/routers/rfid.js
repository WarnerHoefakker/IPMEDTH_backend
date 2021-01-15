const express = require('express');
const router = new express.Router();
const Room = require('../models/room');
const Tag = require('../models/rfid');
const People = require('../models/people');
const CO2 = require('../models/co2');
const LoggedInTagsLog = require('../models/logged_in_tags_log');
const {sendWelcomeMessage, sendTooManyPeopleMessage} = require('../sendNotification');
const {determineSafetyLevel, determineSafetyLevelPeople} = require('../determineSafetyLevel');

const EventEmitter = require('../EventEmitter');
const {sendSafetyLevelMessage} = require("../sendNotification");

const logPeopleAmount = async (room) => {
    const today = new Date();

    const count = await People.countDocuments({
        roomId: room._id,
        createdAt: {$gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())}
    }, async (err, count) => {
        const newTagLog = new LoggedInTagsLog({peopleAmount: count, roomId: room._id, levelId: room.levelId});
        await newTagLog.save();

        return count;
    });

    return count;
}

router.get('/rfid/tagid/:appId', async (req, res) => {
    try {
        const {appId} = req.params;

        const tag = await Tag.findOne({appId});

        if (tag) {
            res.send({tagId: tag.tagId});
        } else {
            res.status(404).send({error: 'Geen tag gekoppeld'})
        }
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

router.post('/rfid/add', async (req, res) => {
    try {
        let {tagId, appId, firebaseToken} = req.body;

        if (typeof tagId === "number") {
            tagId = tagId.toString();
        }

        if (typeof appId === "number") {
            appId = appId.toString();
        }

        if (typeof firebaseToken === "number") {
            firebaseToken = firebaseToken.toString();
        }

        // Als de tag al gebruikt wordt door een andere app, kan deze niet gekoppeld worden
        const existingTag = await Tag.findOne({tagId});
        if (existingTag && existingTag.appId !== appId) {
            await Tag.deleteOne({tagId});
        }

        // Als de app al gekoppeld is aan een tag wordt deze koppeling verwijderd
        // TODO: ook uit people verwijderen
        const existingApp = await Tag.findOne({appId});
        if (existingApp) {
            await Tag.deleteOne({appId});
        }

        const newTag = new Tag({tagId, appId, firebaseToken});
        await newTag.save();

        res.status(201).send(newTag);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.post('/rfid/login', async (req, res) => {
    try {
        let {value, roomid} = req.body; // value = tagId

        if (typeof value === "number") {
            value = value.toString();
        }

        const room = await Room.findOne({roomId: roomid});

        if(!room)
            return res.status(404).send({error: "room does not exist"});

        const tag = await Tag.findOne({tagId: value});

        if(!tag)
            return res.status(404).send({error: "tag does not exist"});

        let co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});

        if (co2 == null) {
            co2 = {value: 0}
        }

        // bereken het huidige veiligheidsniveau om dit te kunnen vergelijken met het nieuwe veiligheidsniveau voor het sturen van een notificatie
        const today = new Date();

        const amountOfPeople = await People.countDocuments({
            roomId: room._id,
            createdAt: {$gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())}
        }, async (err, count) =>  count);

        let currentSafetyLevel = determineSafetyLevel(co2.value, amountOfPeople, room.peopleAmount);

        if (!tag) {
            res.status(400).send({message: 'Tag niet gekoppeld'});
            return false
        }

        if (!room) {
            res.status(400).send({message: 'Ruimte bestaat niet'});
            return false
        }

        const existingLogin = await People.findOne({tagId: tag._id}).populate('roomId');
        if (existingLogin) {
            await People.deleteOne({tagId: tag._id});

            // Als de gebruiker in een ander lokaal inlogt wordt de log van het oude lokaal ook opgeslagen
            if (room.roomId !== existingLogin.roomId.roomId) {
                logPeopleAmount(existingLogin.roomId)
            }
        }

        const newLogin = new People({tagId: tag._id, roomId: room._id, roomName: room.roomName, levelId: room.levelId});

        await newLogin.save();

        // Sla het aantal mensen op dat in het lokaal is
        const count = await logPeopleAmount(room);

        // Stuur welkom notification
        let safetyLevel = determineSafetyLevel(co2.value, count, room.peopleAmount);
        sendWelcomeMessage(room.roomName, tag.firebaseToken, safetyLevel);

        // Stuur notificatie als er te veel mensen zijn
        if (count > (room.peopleAmount * 0.9)) {
            // Haal alle mensen in het lokaal op voor het versturen van een notificatie
            const people = await People.find({roomName: room.roomName}).populate('tagId');

            for (let i = 0; i < people.length; i++) {
                sendTooManyPeopleMessage(room.roomName, people[i].tagId.firebaseToken);
            }
        }

        // Stuur notificatie als het veiligheidsniveau is veranderd
        let newSafetyLevel = determineSafetyLevel(co2.value, count, room.peopleAmount);

        console.log(currentSafetyLevel, newSafetyLevel)

        if(newSafetyLevel !== currentSafetyLevel) {
            const people = await People.find({roomName: room.roomName}).populate('tagId');

            for (let i = 0; i < people.length; i++) {
                sendSafetyLevelMessage(room.roomName, newSafetyLevel, people[i].tagId.firebaseToken)
            }
        }

        res.status(201).send(newLogin);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.post('/rfid/logout', async (req, res) => {
    try {
        const {value} = req.body;

        const tag = await Tag.findOne({tagId: value});
        if (!tag) {
            res.status(404).send({error: 'Tag niet gekoppeld'});
            return false
        }

        const existingLogin = await People.findOne({tagId: tag._id}).populate('roomId');

        if(!existingLogin)
            return res.status(200).send({message: "Success"});

        const room = await Room.findOne({roomId: existingLogin.roomId.roomId});
        let co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});

        if(co2 === null) {
            co2 = {value: 0}
        }

        // bereken het huidige veiligheidsniveau om dit te kunnen vergelijken met het nieuwe veiligheidsniveau voor het sturen van een notificatie
        const today = new Date();

        const amountOfPeople = await People.countDocuments({
            roomId: room._id,
            createdAt: {$gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())}
        }, async (err, count) =>  count);

        let currentSafetyLevel = determineSafetyLevel(co2.value, amountOfPeople, room.peopleAmount);

        if (existingLogin) {
            await People.deleteOne({tagId: tag._id});

            const count = await logPeopleAmount(existingLogin.roomId)

            // Stuur notificatie als het veiligheidsniveau is veranderd
            let newSafetyLevel = determineSafetyLevel(co2.value, count, room.peopleAmount);

            if(newSafetyLevel !== currentSafetyLevel) {
                const people = await People.find({roomName: room.roomName}).populate('tagId');

                for (let i = 0; i < people.length; i++) {
                    sendSafetyLevelMessage(room.roomName, newSafetyLevel, people[i].tagId.firebaseToken)
                }
            }
        }

        res.send({message: "Success"});
    } catch (e) {
        console.log(e)
        res.status(500).send({type: e.message});
    }
});

module.exports = router;
