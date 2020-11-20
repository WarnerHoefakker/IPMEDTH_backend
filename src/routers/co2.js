const express = require('express');
const router = new express.Router();
const Level = require('../models/level');
const Co2 = require('../models/co2');

router.get('/co2', (req, res) => {
    res.send({value: 1200});
});

router.post('/co2add', async (req, res) => {
    const { value } = req.body;

    const newValue = new Co2({value: value,roomid:0});

    await newValue.save();

    // const level = await Co2.find({});

    console.log(value);
    res.send({value: 1200});
});

router.get('/test', async (req, res) => { //TODO: verwijderen
    const newLevel = new Level({levelName: 'test'});

    await newLevel.save();

    const level = await Level.find({});

    res.send(level);
});



module.exports = router;