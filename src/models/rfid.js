const mongoose = require('../db/mongoose');

const rfidSchema = mongoose.Schema({
    tagId: {
        type: String,
        required: true,
        unique: true
    },
    appId: {
        type: String,
        required: true,
        unique: true
    },
    firebaseToken: {
        type: String,
        required: true,
        unique: true
    }
},{timestamps:true});

const Tag = mongoose.model('Tag', rfidSchema);

module.exports = Tag;
