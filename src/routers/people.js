const express = require('express');
const router = new express.Router();
const Room = require('../models/room');
const People = require('../models/people');

router.get('/people/:roomId', async (req, res) => {
    try {
        People.countDocuments({ roomId: req.params.roomId }, function (err, count) {
          console.log(count);
          res.send(count);
        });
    } catch (e) {
        res.status(500).send({type: e.message});
    }
});


module.exports = router;
