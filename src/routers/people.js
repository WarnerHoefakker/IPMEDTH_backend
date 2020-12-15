const express = require('express');
const router = new express.Router();
const People = require('../models/people');
const Tag = require('../models/rfid');
const Room = require('../models/room');

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

router.get('/people/currentlocation', async (req, res) => {
    try {
        const {appId} = req.body;

        const tag = await Tag.findOne({appId});
        if(!tag) {
            res.status(400).send({message: 'App is niet gekoppeld'});
            return false
        }

        const currentLogin = await People.findOne({tagId: tag._id}).populate('levelId');

        if(!currentLogin) {
            res.status(400).send({message: 'Tag niet ingelogd'});
            return false
        }

        res.send({roomName: currentLogin.roomName, levelName: currentLogin.levelId.levelName});
    } catch (e) {
        res.status(500).send({type: e.message});
    }
})


module.exports = router;
