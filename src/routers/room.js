const express = require('express');
const router = new express.Router();
const serverSentEvents = require('../middleware/serverSentEvents');
const Room = require('../models/room');
const Level = require('../models/level');
const CO2 = require('../models/co2');
const People = require('../models/people');
const EventEmitter = require('../EventEmitter');
const {determineSafetyLevel} = require('../determineSafetyLevel');
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

        const rooms = await Room.find(filter).populate("levelId");
        const adjustedRooms = JSON.parse(JSON.stringify(rooms));

        for (const room of adjustedRooms) {
            let co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});
            let people = await People.countDocuments({roomId: room._id}).exec();

            if (co2 == null) {
                co2 = {value: 0}
            }

            let safetyLevel = determineSafetyLevel(co2.value, people, room.peopleAmount);

            room.co2 = co2.value;
            room.people = people;
            room.safetyLevel = safetyLevel;
        }

        adjustedRooms.sort((a, b) => (a.safetyLevel > b.safetyLevel) ? 1 : ((b.safetyLevel > a.safetyLevel) ? -1 : 0));
        return res.send(adjustedRooms);
    } catch (e) {
        return res.status(500).send({type: e.message});
    }
});

router.get('/:roomId/currentstatus', async (req, res) => {
    try {
        const room = await Room.findOne({roomId: req.params.roomId});

        if(!room)
            return res.status(404).send({error: 'Room doesn\'t exist'});

        let co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});

        if (co2 == null) {
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
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/rooms/:roomId', async (req, res) => {
    try {
        const room = await Room.findOne({roomId: req.params.roomId});

        res.send(room);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/rooms/:roomId/history', async (req, res) => {
    try {
        const {roomId} = req.params;

        const room = await Room.findOne({roomId: roomId});

        let lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const dayLabels = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

        const co2Week = await CO2.aggregate([
            {
                $match: {
                    roomId: room._id,
                    createdAt: {$gt: lastWeek}
                }
            },
            {
                $group: {
                    _id: {
                        "year": {"$year": "$createdAt"},
                        "month": {"$month": "$createdAt"},
                        "day": {"$dayOfMonth": "$createdAt"},
                        "dayOfWeek": {"$dayOfWeek": "$createdAt"},
                    },
                    average: {$avg: '$value'}
                }
            }
        ]);

        const co2day = await CO2.aggregate([
            {
                $match: {
                    roomId: room._id,
                    createdAt: {$gt: yesterday}
                }
            },
            {
                $group: {
                    _id: {
                        "year": {"$year": "$createdAt"},
                        "month": {"$month": "$createdAt"},
                        "day": {"$dayOfMonth": "$createdAt"},
                        hour: {"$hour": "$createdAt"}
                    },
                    average: {$avg: '$value'}
                }
            }
        ]);

        let co2WeekValues = [];
        for (let i = 0; i < co2Week.length; i++) {
            co2WeekValues.push({
                timestamp: dayLabels[co2Week[i]._id.dayOfWeek - 1],
                co2Value: co2Week[i].average
            })
        }
        let co2DayValues = [];
        for (let i = 0; i < co2day.length; i++) {
            const hour = co2day[i]._id.hour + 1;

            if (hour >= 8 && hour <= 18) {
                const hourString = String("0" + hour).slice(-2);
                co2DayValues.push({
                    timestamp: hourString,
                    co2Value: co2day[i].average
                })
            }
        }

        const peopleWeek = await LoggedInTagsLog.aggregate([
            {
                $match: {
                    createdAt: {$gt: lastWeek}, roomId: room._id
                }
            },
            {
                $group: {
                    _id: {
                        "year": {"$year": "$createdAt"},
                        "month": {"$month": "$createdAt"},
                        "day": {"$dayOfMonth": "$createdAt"},
                        "dayOfWeek": {"$dayOfWeek": "$createdAt"},
                    },
                    average: {$avg: '$peopleAmount'}
                }
            }
        ]);

        const peopleDay = await LoggedInTagsLog.aggregate([
            {
                $match: {
                    createdAt: {
                        $gt: yesterday
                    },
                    roomId: room._id
                }
            },
            {
                $group: {
                    _id: {
                        "year": {"$year": "$createdAt"},
                        "month": {"$month": "$createdAt"},
                        "day": {"$dayOfMonth": "$createdAt"},
                        hour: {"$hour": "$createdAt"}
                    },
                    average: {$avg: '$peopleAmount'}
                }
            }
        ]);

        let peopleWeekValues = [];
        const peopleWeekLabels = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
        for (let i = 0; i < peopleWeek.length; i++) {
            let day = dayLabels[peopleWeek[i]._id.dayOfWeek - 1];
            peopleWeekValues.push({
                timestamp: day,
                amountOfPeople: peopleWeek[i].average
            })

            const index = peopleWeekLabels.indexOf(day);
            if (index !== -1) {
                peopleWeekLabels.splice(index, 1);
            }
        }

        for (let i = 0; i < peopleWeekLabels.length; i++) {
            peopleWeekValues.push({
                timestamp: peopleWeekLabels[i],
                amountOfPeople: 0
            })
        }

        let peopleDayValues = [];
        let peopleDayLabels = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
        for (let i = 0; i < peopleDay.length; i++) {
            const hour = peopleDay[i]._id.hour + 1;

            if (hour >= 8 && hour <= 18) {
                const hourString = String("0" + hour).slice(-2);
                peopleDayValues.push({
                    timestamp: hourString,
                    amountOfPeople: peopleDay[i].average
                });

                const index = peopleDayLabels.indexOf(hour);
                if (index !== -1) {
                    peopleDayLabels.splice(index, 1);
                }
            }
        }

        for (let i = 0; i < peopleDayLabels.length; i++) {
            peopleDayValues.push({
                timestamp: peopleDayLabels[i],
                amountOfPeople: 0
            })
        }

        res.send({
            peopleData: {
                today: peopleDayValues,
                week: peopleWeekValues,
                min: 0,
                max: room.peopleAmount
            },
            co2Data: {
                today: co2DayValues,
                week: co2WeekValues,
                min: 0,
                max: 1600
            }
        });
    } catch (e) {
        res.status(500).send({type: e.message});
    }

});

router.get('/rooms/:roomId/averageOccupation', async (req, res) => {
    try {
        const {roomId} = req.params;

        const room = await Room.findOne({roomId: roomId});

        const dayLabels = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

        const peopleWeek = await LoggedInTagsLog.aggregate([
            {
                $match: {
                    roomId: room._id
                }
            },
            {
                $group: {
                    _id: {
                        "dayOfWeek": {"$dayOfWeek": "$createdAt"},
                    },
                    average: {$avg: '$peopleAmount'}
                }
            }
        ]);

        const peopleDay = await LoggedInTagsLog.aggregate([
            {
                $match: {
                    roomId: room._id
                }
            },
            {
                $group: {
                    _id: {
                        "dayOfWeek": {"$dayOfWeek": "$createdAt"},
                        hour: {"$hour": "$createdAt"}
                    },
                    average: {$avg: '$peopleAmount'}
                }
            }
        ]);

        let peopleWeekValues = [];
        const peopleWeekLabels = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
        for (let i = 0; i < peopleWeek.length; i++) {
            let day = dayLabels[peopleWeek[i]._id.dayOfWeek - 1];
            peopleWeekValues.push({
                timestamp: day,
                amountOfPeople: peopleWeek[i].average
            })

            const index = peopleWeekLabels.indexOf(day);
            if (index !== -1) {
                peopleWeekLabels.splice(index, 1);
            }
        }

        for (let i = 0; i < peopleWeekLabels.length; i++) {
            peopleWeekValues.push({
                timestamp: peopleWeekLabels[i],
                amountOfPeople: 0
            })
        }

        let peopleDayValues = [];
        let peopleDayLabels = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
        const today = new Date();
        for (let i = 0; i < peopleDay.length; i++) {
            if (dayLabels[peopleDay[i]._id.dayOfWeek - 1] === dayLabels[today.getDay()]) {
                const hour = peopleDay[i]._id.hour + 1;

                if (hour >= 8 && hour <= 18) {
                    const hourSting = String("0" + hour).slice(-2);
                    peopleDayValues.push({
                        timestamp: hourSting,
                        amountOfPeople: peopleDay[i].average
                    });

                    const index = peopleDayLabels.indexOf(hour);
                    if (index !== -1) {
                        peopleDayLabels.splice(index, 1);
                    }
                }
            }
        }

        for (let i = 0; i < peopleDayLabels.length; i++) {
            peopleDayValues.push({
                timestamp: peopleDayLabels[i],
                amountOfPeople: 0
            })
        }

        res.status(201).send(
            {
                week: peopleWeekValues,
                day: peopleDayValues,
                min: 0,
                max: room.peopleAmount
            });
    } catch (e) {
        res.status(500).send({type: e.message});
    }
})

router.post('/rooms/add', async (req, res) => {
    try {
        const {levelName, roomId, roomName, peopleAmount} = req.body;

        const level = await Level.findOne({levelName});

        const existingRoom = await Room.findOne({roomId});

        if(existingRoom)
            return res.status(400).send({error: 'roomId already exists'})

        const room = new Room({roomId, roomName, peopleAmount, levelId: level._id});

        await room.save();

        res.status(201).send(room);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

module.exports = router;
