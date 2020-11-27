const express = require('express');
const router = new express.Router();
const Room = require('../models/room');
const Level = require('../models/level');
const CO2 = require('../models/co2');

router.get('/rooms', async (req, res) => {
    /*
    *  Options:
    *   - levelName: naam van de verdieping voor het filteren van ruimtes op verdieping
    *
    * */

    try {
        let filter = {};

        const { levelName } = req.body;

        if(levelName !== undefined){
            const level = await Level.findOne({levelName});

            filter.levelId = level._id;
        }

        const rooms = await Room.find(filter);

        res.send(rooms);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/rooms/currentstatus', async (req, res) => {
    // route voor huidige status van alle lokalen
    // hierbij ook filter toevoegen (dashboard filter)
})

router.get('/rooms/:roomId', async (req, res) => {
    try {
        const room = await Room.findOne({roomId: req.params.roomId});

        res.send(room);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/rooms/:roomId/currentstatus', async (req, res) => {
    try {
        let response = {};

        const room = await Room.findOne({roomId: req.params.roomId});

        const co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});

        response.co2 = {level: co2.value};

        // TODO: bezetting toevoegen
        response.people = {amount: 0, max: 0};

        res.send(response);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/rooms/:roomId/today', async (req, res) => {

});

router.get('/rooms/:roomId/lastweek', async (req, res) => {

});

router.post('/rooms/add', async (req, res) => {
    try {
        const { levelName, roomId, roomName, peopleAmount } = req.body;

        const level = await Level.findOne({levelName});

        const room = new Room({roomId, roomName, peopleAmount, levelId: level._id});

        await room.save();

        res.status(201).send(room);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

module.exports = router;