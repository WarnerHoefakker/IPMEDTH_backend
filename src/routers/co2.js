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

router.post('/co2add', async (req, res) => {
    try {
        const { value, roomId } = req.body;

        const room = await Room.findOne({roomId});

        if(!room)
            return res.status(404).send({error: "room doesn\'t exist"});

        let yesterday = new Date();
        yesterday.setHours(0,0,0,0);

        let tomorrow = new Date();

        const currentCo2 = await Co2.findOne({roomId: room._id, createdAt: {$gt: yesterday, $lt: tomorrow}}).sort({createdAt: -1});

        // bereken het huidige veiligheidsniveau om dit te kunnen vergelijken met het nieuwe veiligheidsniveau voor het sturen van een notificatie
        const today = new Date();

        const amountOfPeople = await People.countDocuments({
            roomId: room._id,
            createdAt: {$gt: new Date(today.getFullYear(), today.getMonth(), today.getDate())}
        }, async (err, count) =>  count);

        let currentSafetyLevel = 'green';

        if(currentCo2 !== null)
            currentSafetyLevel = determineSafetyLevel(currentCo2.value, amountOfPeople, room.peopleAmount);

        const newValue = new Co2({value: value, roomId: room._id});
        await newValue.save();

        EventEmitter.emit('update-status', {roomId});

        await newValue.save();

        let FIVE_MIN = 5*60*1000;
        // let FIVE_MIN = 10;
        // sendCo2LevelMessage(room.roomName, "exoZLlRKT3WNx1quM-WNxc:APA91bG8b9ui5S5fHfl227IwiIRuDlMp3_ZU2r5_A3UmiShj1eE2dYa-7Cm9Q0NdvHv5EUGIWZzOYUS4GAPXl38eDeP_xudpQsP2GlBZH59Ly9qP5xGfah3OMCdZGV042OUdhLvM-AVA");

        if(sentNotifications.tooHigh[room.roomId] === undefined || new Date() - sentNotifications.tooHigh[room.roomId].time > FIVE_MIN){
            if(value > 1000 && currentCo2.value <= 1000) {
                sentNotifications.tooHigh[room.roomId] = {
                    time: new Date()
                };

                const people = await People.find({roomName: room.roomName}).populate('tagId');

                for (let i = 0; i < people.length; i++) {
                    try {
                        sendCo2LevelMessage(room.roomName, people[i].tagId.firebaseToken);
                    } catch(e) {
                        console.log(e)
                    }

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
                    try{
                        sendSafetyLevelMessage(room.roomName, newSafetyLevel, currentSafetyLevel, people[i].tagId.firebaseToken)
                    } catch(e) {
                        console.log(e)
                    }
                }
            }
        }

        res.status(201).send(newValue);
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

module.exports = router;
