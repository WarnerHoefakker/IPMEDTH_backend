const express = require('express');
const router = new express.Router();

router.get('/test', (req, res) => {
    res.send('test');
});

router.get('/', (req, res) => {
    res.send('home')
});

router.get('/123', (req, res) => {
    res.send('123')
});

module.exports = router;