const express = require('express');
const router = new express.Router();
const Level = require('../models/level');

router.get('/co2', (req, res) => {
    res.send({value: 1200});
});

router.get('/test', async (req, res) => { //TODO: verwijderen
    const newLevel = new Level({levelName: 'test'});

    await newLevel.save();

    const level = await Level.find({});

    res.send(level);
});

module.exports = router;