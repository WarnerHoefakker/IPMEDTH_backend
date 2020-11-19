const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL, {
    // options to fix deprecation warnings
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    console.log('connected to database');
});

module.exports = mongoose;