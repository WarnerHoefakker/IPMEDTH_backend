const express = require('express');
const router = new express.Router();

router.get('/rfid', (req, res) => {
    res.send({tag: 'id123'});
});

module.exports = router;