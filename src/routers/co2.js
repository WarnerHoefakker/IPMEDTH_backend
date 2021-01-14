const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const Co2 = require('../models/co2');
const Room = require('../models/room');
const People = require('../models/people');
const {sendCo2LevelMessage} = require('../sendNotification');

const EventEmitter = require('../EventEmitter');

let sentNotifications = {};

router.get('/co2', (req, res) => {
    res.send({value: 1200});
});

router.post('/co2add', async (req, res) => {
    try {
        const { value, roomId } = req.body;

        const room = await Room.findOne({roomId});
        const currentCo2 = await Co2.findOne({roomId: room._id}).sort({createdAt: -1});

        const newValue = new Co2({value: value, roomId: room._id});
        await newValue.save();

        EventEmitter.emit('update-status', {roomId});

        await newValue.save();

        let FIVE_MIN=5*60*1000;

        if(sentNotifications[room.roomId] === undefined || new Date() - sentNotifications[room.roomId].time > FIVE_MIN){
            if(value > 1000 && currentCo2.value <= 1000) {
                sentNotifications[room.roomId] = {
                    time: new Date()
                };

                console.log(sentNotifications)

                const people = await People.find({roomName: room.roomName}).populate('tagId');

                for (let i = 0; i < people.length; i++) {
                    sendCo2LevelMessage(room.roomName, people[i].tagId.firebaseToken);
                }
            }
        }

        res.send(newValue);
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

module.exports = router;
