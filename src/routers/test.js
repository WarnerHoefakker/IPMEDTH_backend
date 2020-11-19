const express = require('express');
const router = new express.Router();

router.get('/test', (req, res) => {
    res.send('test');
});

router.post('/id', (req, res) => {
    res.send('joejoe');
    res.send(res.data);
});

module.exports = router;