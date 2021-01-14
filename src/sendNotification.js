const admin = require("firebase-admin");
const serviceAccount = require("../.firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// notification: {
//     title: 'Message from node',
//         body: 'hey there'
// },
// token: "eB84KMzKTv2R8WaIuNq4Ua:APA91bFc9R9q0NnhC28OVyTZtllWieM38B9afrij4JkHsECl5FEg1-_lebbN_Npki0H4klMsiNvfbcY_mPY6fcDnBajTcSyJSCTztJn4ZXoHMKhggYDQckvl-Dy9ykr1SU5risylh1VG"

const sendWelcomeMessage = (roomName, token, status) => {
    const statusObj = {
        red: 'slecht',
        orange: 'matig',
        green: 'goed'
    }

    sendMessage(
        {
            title: 'Welkom in lokaal ' + roomName,
            body: 'De status van lokaal ' + roomName + ' is ' + statusObj[status]
        },
        token
    )
}

const sendTooManyPeopleMessage = (roomName, token) => {
    sendMessage(
        {
            title: 'Veiligheidswaarschuwing',
            body: 'Er zijn te veel mensen aanwezig in lokaal ' + roomName
        },
        token
    )
}

const sendMessage = (notification, token) => {
    const message = {
        notification,
        token
    };

    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
};

module.exports = {
    sendWelcomeMessage,
    sendTooManyPeopleMessage
};