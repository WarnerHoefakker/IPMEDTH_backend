const express = require('express');
const router = new express.Router();

router.get('/test', (req, res) => {
    res.send('test');
});

app.post('/id', function (req, res) {
  res.send('joejoe')
  console.log(res.data)
});

router.get('/', (req, res) => {
    res.send('home')
});

router.get('/123', (req, res) => {
    res.send('123')
});

module.exports = router;
