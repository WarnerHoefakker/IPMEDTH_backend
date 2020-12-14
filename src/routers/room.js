const express = require('express');
const router = new express.Router();
const serverSentEvents = require('../middleware/serverSentEvents');
const Room = require('../models/room');
const Level = require('../models/level');
const CO2 = require('../models/co2');
const People = require('../models/people');
const EventEmitter = require('../EventEmitter');

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

        res.send(rooms);
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/:roomId/currentstatus', async(req, res) => {
    try{
        const room = await Room.findOne({roomId: req.params.roomId});
        const co2 = await CO2.findOne({roomId: room._id}).sort({createdAt: -1});
        if(co2 == null){
            co2 = 0;
        }
        const peopleAmount = await People.countDocuments({roomId: room._id}).exec();

        const response = {
            co2: {
                level: co2.value
            },
            people: {
                people: peopleAmount,
                max: room.peopleAmount
            }
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
    // const room = await People.findOne({roomId: 'LC4044'});
    // let start = new Date(now.getFullYear(),now.getMonth(),now.getDate(),1,0,0);
    const room = await People.find({roomName: 'LC4044'});
    var i;
    var monday = 0;
    var tuesday = 0;
    var wednesday = 0;
    var thursday = 0;
    var friday = 0;
    var nine = 0;
    var ten = 0;
    var eleven = 0;
    var twelve = 0;
    var thirteen = 0;
    var fourteen = 0;
    var fifteen = 0;
    var sixteen = 0;
    var seventeen = 0;
    var eighteen = 0;

    for (i = 0; i < room.length; i++){
      var tijd = String(room[i].createdAt);
      if (tijd.substring(0, 10) == "Mon Dec 07") {
        monday++
        console.log(monday);
        if (tijd.substring(16, 18) == "9") {
          nine++
        }
        if (tijd.substring(16, 18) == "10") {
          ten++
        }
        if (tijd.substring(16, 18) == "11") {
          eleven++
        }
        if (tijd.substring(16, 18) == "12") {
          twelve++
        }
        if (tijd.substring(16, 18) == "13") {
          thirteen++
        }
        if (tijd.substring(16, 18) == "14") {
          fourteen++
        }
        if (tijd.substring(16, 18) == "15") {
          fifteen++
        }
        if (tijd.substring(16, 18) == "16") {
          sixteen++
        }
        if (tijd.substring(16, 18) == "17") {
          seventeen++
        }
        if (tijd.substring(16, 18) == "18") {
          eighteen++
        }
      }
      else if (tijd.substring(0, 10) == "Tue Dec 08") {
        tuesday++
        // console.log(tuesday);
      }
      else if (tijd.substring(0, 10) == "Wed Dec 09") {
        wednesday++
        // console.log(wednesday);
      }
      else if (tijd.substring(0, 10) == "Thu Dec 10") {
        thursday++
        // console.log(thursday);
      }
      else if (tijd.substring(0, 10) == "Fri Dec 11") {
        friday++
        // console.log(friday);
      }
    }

    var lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() -7);

    const co2 = await CO2.find({roomId: room._id, createdAt: {$gt: lastWeek}});


    // console.log(co2);
    // console.log(room);


    // res.send({
    //         today: {
    //             co2: [],
    //             people: []
    //         },
    //         lastweek: {
    //             co2: [],
    //             people: []
    //         }
    // });

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
