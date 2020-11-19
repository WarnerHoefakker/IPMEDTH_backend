const express = require('express');
const testRouter = require('./routers/test');

const socket = new WebSocket('ws://188.166.54.87/');

socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
});

socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});

const app = express();
app.use(express.json());
app.use(testRouter);

app.listen(process.env.PORT || 3000, () => {
    console.log('server is up on port ', process.env.PORT || 3000)
});