const mongoose = require('../db/mongoose');

const levelSchema = mongoose.Schema({
    levelName: {
        type: String,
        required: true,
        unique: true
    }
});

const Level = mongoose.model('Level', levelSchema);

module.exports = Level;