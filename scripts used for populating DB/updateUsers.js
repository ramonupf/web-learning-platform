require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User'); // Your User model

mongoose.connect(process.env.MONGODB_URI);

async function updateUsers() {
    try {
        const result = await User.updateMany(
            { $or: [{ coursesEnrolled: { $exists: false } }, { trialCourses: { $exists: false } }] },
            { $set: { coursesEnrolled: [], trialCourses: [] } }
        );
        console.log('Updated users:', result);
    } catch (err) {
        console.error('Error updating users:', err);
    } finally {
        mongoose.connection.close();
    }
}

updateUsers();