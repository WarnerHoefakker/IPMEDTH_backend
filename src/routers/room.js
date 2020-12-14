const express = require('express');
const router = new express.Router();
const serverSentEvents = require('../middleware/serverSentEvents');
const Room = require('../models/room');
const Level = require('../models/level');
const CO2 = require('../models/co2');
const People = require('../models/people');
const EventEmitter = require('../EventEmitter');
const determineSafetyLevel = require('../determineSafetyLevel');
const LoggedInTagsLog = require('../models/logged_in_tags_log');

router.get('/rooms', async (req, res) => {
    /*
    *  Options:
    *   - levelName: naam van de verdieping voor het filteren van ruimtes op verdieping
    *
    * */

    try {
        let filter = {};

        const {levelName} = req.body;

        if (levelName !== undefined) {
            const level = await Level.findOne({levelName});

            filter.levelId = level._id;
        }

        const rooms = await Room.find(filter);
        const adjustedRooms = JSON.parse(JSON.stringify(rooms))

        for(const room of adjustedRooms){
            let co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});
            let people = await People.countDocuments({roomId: room._id}).exec();

            if(co2 == null){
                co2 = {value: 0}
            }

            let safetyLevel = determineSafetyLevel(co2.value, people, room.peopleAmount);

            room.co2 = co2.value;
            room.people = people;
            room.safetyLevel = safetyLevel;
        }

        adjustedRooms.sort((a, b) => (a.safetyLevel > b.safetyLevel) ? 1 : ((b.safetyLevel > a.safetyLevel) ? -1 : 0));
        res.send(adjustedRooms);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/:roomId/currentstatus', async(req, res) => {
    try{
        const room = await Room.findOne({roomId: req.params.roomId});
        let co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});

        if(co2 == null){
            co2 = {value: 0}
        }

        const peopleAmount = await People.countDocuments({roomId: room._id}).exec();

        const safetyLevel = determineSafetyLevel(co2.value, peopleAmount, room.peopleAmount);

        const response = {
            co2: {
                level: co2.value
            },
            people: {
                people: peopleAmount,
                max: room.peopleAmount
            },
            safetyLevel
        }

        res.send(response);

    } catch(e){
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
    async function getCo2AndOccupation({roomId}) {
        try {
            if (roomId === req.params.roomId) { // alleen als het roomid dat vanuit het event wordt meegegeven hetzelfde is als het roomid waar naar wordt geluisteerd wordt de nieuwe waarde gestuurd
                const room = await Room.findOne({roomId: req.params.roomId});

                const co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});

                const peopleAmount = await People.countDocuments({ roomId: room._id }).exec();

                const response = {
                    co2: {
                        level: co2.value
                    },
                    people: {
                        amount: peopleAmount,
                        max: room.peopleAmount
                    }
                };

                res.sendEventStreamData(response);
            }
        } catch (e) {
            res.status(500).send({type: e.message});
        }
    }

    EventEmitter.on('update-status', getCo2AndOccupation);
    // TODO: huidige waarde 1x versturen op het moment dat er verbinding gemaakt wordt

    // close connection
    res.on('close', () => {
        EventEmitter.removeListener('update-status', getCo2AndOccupation);
        res.end();
    });
});

router.get('/rooms/:roomId/history', async (req, res) => {

    const room = await Room.findOne({roomId: 'LC4044'});

    var lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() -7);

    const co2Week = await CO2.aggregate([
        {
            $match: {
                roomId: room._id,
                createdAt: {$gt: lastWeek}
            }
        },
        {
            $group: {
                _id: {"year": {"$year": "$createdAt"}, "month": {"$month": "$createdAt"}, "day": {"$dayOfMonth": "$createdAt"},},
                average: {$avg: '$value'}
            }
        }
    ]);

    const peopleWeek = await LoggedInTagsLog.aggregate([
    {
        $match: {
            createdAt: {$gt: lastWeek}, roomId: room._id
        }
    },
    {
        $group: {
            _id: {"year": {"$year": "$createdAt"}, "month": {"$month": "$createdAt"}, "day": {"$dayOfMonth": "$createdAt"}},
            average: {$avg: '$peopleAmount'}
        }
    }
    ]);

    const co2day = await CO2.aggregate([
        {
            $match: {
                createdAt: {$gt: lastWeek}
            }
        },
        {
            $group: {
                _id: {"year": {"$year": "$createdAt"}, "month": {"$month": "$createdAt"}, "day": {"$dayOfMonth": "$createdAt"}, hour: {"$hour": "$createdAt"}},
                average: {$avg: '$co2day'}
            }
        }
    ]);

    const peopleDay = await LoggedInTagsLog.aggregate([
        {
            $match: {
              createdAt: {$gt: lastWeek}, roomId: room._id
            }
          },
          {
            $group: {
                _id: {"year": {"$year": "$createdAt"}, "month": {"$month": "$createdAt"}, "day": {"$dayOfMonth": "$createdAt"}, hour: {"$hour": "$createdAt"}},
                average: {$avg: '$peopleAmount'}
            }
        }
      ]);

    res.send({
            today: {
                co2: co2day,
                people: peopleDay
            },
            lastweek: {
                co2: co2Week,
                people: peopleWeek
            }
    });

});

router.post('/rooms/add', async (req, res) => {
    try {
        const {levelName, roomId, roomName, peopleAmount} = req.body;

        const level = await Level.findOne({levelName});

        const room = new Room({roomId, roomName, peopleAmount, levelId: level._id});

        await room.save();

        res.status(201).send(room);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

module.exports = router;
