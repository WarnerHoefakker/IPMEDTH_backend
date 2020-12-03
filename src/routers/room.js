const express = require('express');
const router = new express.Router();
const serverSentEvents = require('../middleware/serverSentEvents');
const Room = require('../models/room');
const Level = require('../models/level');
const CO2 = require('../models/co2');

const EventEmitter = require('../EventEmitter');

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

router.get('/rooms/:roomId/currentstatus', serverSentEvents, async (req, res) => {
    async function getCo2AndOccupation() {
        let response = {};

        const room = await Room.findOne({roomId: req.params.roomId});

        const co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});

        response.co2 = {level: co2.value};

        // TODO: bezetting toevoegen
        response.people = {amount: 0, max: 0};

        res.sendEventStreamData(response);
    }

    try {
        EventEmitter.on('new-co2', getCo2AndOccupation)
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/rooms/:roomId/today', async (req, res) => {

});

router.get('/rooms/:roomId/lastweek', async (req, res) => {

});


// Test Server Sent Events
var events              = require('events');
var event_emitter       = new events.EventEmitter();

let testRes = '';

testFunc = (res) => {
    if(res !== '') {
        const data = {
            value: Math.random()*100,
        };

        res.sendEventStreamData(data);
    }
    else
        console.error('no listeners')

};

router.get('/test/sse', serverSentEvents, (req, res) => {
    let count = 0;

    console.log(res.finished)

    function generateAndSendRandomNumber(data) {
        // const data = {
        //     value: Math.random() * 100,
        // };

        if(!res.finished)
            res.sendEventStreamData(data);
        // else
        //     event_emitter.removeListener('test-sse', () => console.log('removed listener')); // TODO: geen idee of dit werkt
    }

    event_emitter.on('test-sse', generateAndSendRandomNumber);

    testRes = res;

    // close
    res.on('close', () => {
        // clearInterval(interval);
        console.log('end connection');
        res.end();
        event_emitter.removeListener('test-sse', generateAndSendRandomNumber);
        console.log(res.finished)
    });
})

router.post('/test/sse/post', (req, res) => {
    event_emitter.emit('test-sse', {
            value: Math.random() * 100});

    res.send('ok');
})

// Geen test meer

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