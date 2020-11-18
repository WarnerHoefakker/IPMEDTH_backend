const express = require('express');
const co2Router = require('./routers/co2');
const rfidRouter = require('./routers/rfid');

const app = express();
app.use(express.json());
app.use(co2Router);
app.use(rfidRouter);

app.listen(process.env.PORT || 3000, () => {
    console.log('server is up on port ', process.env.PORT || 3000)
});