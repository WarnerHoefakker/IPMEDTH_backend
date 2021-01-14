const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const Co2 = require('../models/co2');
const Room = require('../models/room');
const People = require('../models/people');
const {sendCo2LevelMessage} = require('../sendNotification');

const EventEmitter = require('../EventEmitter');
const {sendSafetyLevelMessage} = require("../sendNotification");
const {determineSafetyLevel} = require("../determineSafetyLevel");

let sentNotifications = {
    tooHigh: {},
    safetyLevel: {}
};

router.get('/co2', (req, res) => {
    res.send({value: 1200});
});

router.post('/co2add', async (req, res) => {
    try {
        const { value, roomId } = req.body;

        const room = await Room.findOne({roomId});
        const currentCo2 = await Co2.findOne({roomId: room._id}).sort({createdAt: -1});

        // bereken het huidige veiligheidsniveau om dit te kunnen vergelijken met het nieuwe veiligheidsniveau voor het sturen van een notificatie
        const today = new Date();

        const amountOfPeople = await People.countDocuments({
            roomId: room._id,
            createdAt: {$gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())}
        }, async (err, count) =>  count);

        let currentSafetyLevel = determineSafetyLevel(currentCo2.value, amountOfPeople, room.peopleAmount);

        const newValue = new Co2({value: value, roomId: room._id});
        await newValue.save();

        EventEmitter.emit('update-status', {roomId});

        await newValue.save();

        let FIVE_MIN = 5*60*1000;

        if(sentNotifications.tooHigh[room.roomId] === undefined || new Date() - sentNotifications.tooHigh[room.roomId].time > FIVE_MIN){
            if(value > 1000 && currentCo2.value <= 1000) {
                sentNotifications.tooHigh[room.roomId] = {
                    time: new Date()
                };

                const people = await People.find({roomName: room.roomName}).populate('tagId');

                for (let i = 0; i < people.length; i++) {
                    sendCo2LevelMessage(room.roomName, people[i].tagId.firebaseToken);
                }
            }
        }

        if(sentNotifications.safetyLevel[room.roomId] === undefined || new Date() - sentNotifications.safetyLevel[room.roomId].time > FIVE_MIN){
            let newSafetyLevel = determineSafetyLevel(value, amountOfPeople, room.peopleAmount);

            if(newSafetyLevel !== currentSafetyLevel || (sentNotifications.safetyLevel[room.roomId] !== undefined && newSafetyLevel !== sentNotifications.safetyLevel[room.roomId].safetyLevel)) {
                sentNotifications.safetyLevel[room.roomId] = {
                    time: new Date(),
                    safetyLevel: newSafetyLevel
                };

                const people = await People.find({roomName: room.roomName}).populate('tagId');

                for (let i = 0; i < people.length; i++) {
                    sendSafetyLevelMessage(room.roomName, newSafetyLevel, people[i].tagId.firebaseToken)
                }
            }
        }

        res.send(newValue);
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

module.exports = router;
