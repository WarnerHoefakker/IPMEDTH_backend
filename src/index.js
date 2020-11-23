const express = require('express');
require('dotenv').config();
const co2Router = require('./routers/co2');
const rfidRouter = require('./routers/rfid');

require('./db/mongoose.js');

const app = express();
app.use(express.json());
app.use(co2Router);
app.use(rfidRouter);

app.listen(process.env.PORT || 3001, () => {
    console.log('server is up on port ', process.env.PORT || 3001)
});
