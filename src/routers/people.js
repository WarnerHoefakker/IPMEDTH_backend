const express = require('express');
const router = new express.Router();
const serverSentEvents = require('../middleware/serverSentEvents');
const People = require('../models/people');
const Tag = require('../models/rfid');
const Room = require('../models/room');
const CO2 = require('../models/co2');
const determineSafetyLevel = require('../determineSafetyLevel');
const calculateTimePresent = require('../calculateTimePresent');

router.get('/people/amount/:roomId', async (req, res) => {
    try {
        const room = await Room.findOne({roomId: req.params.roomId});

        People.countDocuments({ roomName: room.roomName }, function (err, count) {
          console.log(count);
          res.send({count});
        });
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});

router.get('/people/currentlocation/:appId', async (req, res) => {
    //TODO: safety level meesturen, tijd meesturen?
    try {
        const {appId} = req.params;

        const tag = await Tag.findOne({appId});
        if(!tag) {
            res.status(400).send({message: 'App is niet gekoppeld'});
            return false
        }

        const currentLogin = await People.findOne({tagId: tag._id}).populate('levelId').populate('roomId');

        if(!currentLogin) {
            res.status(200).send({loggedIn: false});
            return false
        }

        const dayLogin = new Date(currentLogin.createdAt);
        const dayToday = new Date();

        if (dayLogin.setHours(0, 0, 0, 0) !== dayToday.setHours(0, 0, 0, 0)) {
            res.status(200).send({loggedIn: false});
            return false
        }

        const totalTime = calculateTimePresent(currentLogin.createdAt);

        const co2 = await CO2.findOne({roomId: currentLogin.roomId._id}).sort({createdAt: -1});
        const peopleAmount = await People.countDocuments({ roomId: currentLogin.roomId._id }).exec();

        let co2Value = 0;

        if(co2)
            co2Value = co2.value;

        const safetyLevel = determineSafetyLevel(co2Value, peopleAmount, currentLogin.roomId.peopleAmount);


        res.send({loggedIn: true, roomName: currentLogin.roomName, roomId: currentLogin.roomId.roomId, levelName: currentLogin.levelId.levelName, startTime: currentLogin.createdAt, safetyLevel, totalTime});
    } catch (e) {
        console.log(e)
        res.status(500).send({type: e.message});
    }
})

// router.get('/people/currentlocation/:appId', serverSentEvents, async (req, res) => {
//     async function sendNewLocation({eventAppId, tagId}) {
//         try {
//             // nieuwe locatie wordt alleen verstuurd als de tag bij de app hoort
//             if (req.params.appId === eventAppId) {
//                 const currentLogin = await People.findOne({tagId}).populate('levelId');
//
//                 if(!currentLogin) {
//                     res.sendEventStreamData({loggedIn: false});
//                 } else {
//                     res.sendEventStreamData({loggedIn: true, roomName: currentLogin.roomName, roomId: currentLogin.roomId, levelName: currentLogin.levelId.levelName, startTime: currentLogin.createdAt});
//                 }
//             }
//         } catch (e) {
//             res.status(500).send({type: e.message}); // TODO: als er iets fout gaat wordt de hele verbinding verbroken > in front end zorgen voor nieuwe verbinding?
//         }
//     }
//
//     // huidige locatie wordt eerst één keer verstuurd op het moment dat de app verbinding maakt
//     const tag = await Tag.findOne({appId: req.params.appId});
//     const currentLogin = await People.findOne({tagId: tag._id}).populate('levelId');
//
//     if(!currentLogin) {
//         res.sendEventStreamData({loggedIn: false});
//     } else {
//         res.sendEventStreamData({loggedIn: true, roomName: currentLogin.roomName, levelName: currentLogin.levelId.levelName, startTime: currentLogin.createdAt});
//     }
//
//     EventEmitter.on('new-login', sendNewLocation);
//
//     // close connection
//     res.on('close', () => {
//         console.log('end connection');
//         EventEmitter.removeListener('new-login', sendNewLocation);
//         res.end();
//     });
//
// })


module.exports = router;
