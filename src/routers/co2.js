const express = require('express');
const router = new express.Router();

router.get('/co2', (req, res) => {
    res.send({value: 1200});
});

module.exports = router;