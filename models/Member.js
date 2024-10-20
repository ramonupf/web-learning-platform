//defines the structure of the Member document in MongoDB
// defines name, photoUrl, bio, and role. Mongoose

const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    photoUrl: { type: String, required: true },
    bio: { type: String, required: true },
    role: { type: String, required: true }
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;