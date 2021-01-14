const express = require('express');
const router = new express.Router();



router.get('/test-notification', (req, res) => {
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });

    res.send('sent message')
});

module.exports = router;
