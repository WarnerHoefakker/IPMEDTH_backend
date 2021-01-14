const express = require('express');
require('dotenv').config();
const co2Router = require('./routers/co2');
const rfidRouter = require('./routers/rfid');
const roomRouter = require('./routers/room');
const peopleRouter = require('./routers/people');
const levelRouter = require('./routers/level');
const testRouter = require('./routers/test-notification');

require('./db/mongoose.js');

const app = express();
app.use(express.json());
app.use(co2Router);
app.use(rfidRouter);
app.use(roomRouter);
app.use(peopleRouter);
app.use(levelRouter);
app.use(testRouter);

const server = app.listen(process.env.PORT || 3001, () => {
    console.log('server is up on port ', process.env.PORT || 3001)
});

module.exports = server;
