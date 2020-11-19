const express = require('express');
const testRouter = require('./routers/test');

const app = express();
app.use(express.json());
app.use(testRouter);

app.listen(process.env.PORT || 3000, () => {
    console.log('server is up on port ', process.env.PORT || 3000)
});