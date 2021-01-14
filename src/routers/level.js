const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const Room = require('../models/room');
const CO2 = require('../models/co2');
const People = require('../models/people');

const {determineSafetyLevel} = require('../determineSafetyLevel');

router.get('/levels/:levelName/status', async (req, res) => {
    try {
        const {levelName} = req.params;

        const level = await Level.findOne({levelName});
        const rooms = await Room.find({levelId: level._id});

        let response = {};

        for(let i = 0; i < rooms.length; i++) {
            let co2 = await CO2.findOne({roomId: rooms[i]._id}).sort({createdAt: -1});

            if(co2 === null) {
                co2 = {value: 0}
            }

            let peopleAmount = await People.countDocuments({roomId: rooms[i]._id}).exec();

            response[rooms[i].roomId] = determineSafetyLevel(co2.value, peopleAmount, rooms[i].peopleAmount);
        }

        res.send(response)
    } catch(e){
        res.status(500).send({type: e.message});
    }

});

module.exports = router;