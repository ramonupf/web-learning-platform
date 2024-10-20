const mongoose = require('mongoose');
const User = require('./models/User'); // Assuming your User model is in models/User.js
require('dotenv').config(); // Load environment variables

// Connect to the database
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Update instructors that are missing the "featured" field
async function updateInstructors() {
    try {
        // Update all instructors without a featured field
        const result = await User.updateMany(
            { accountType: "Instructor", featured: { $exists: false } },
            { $set: { featured: false } }
        );
        console.log(`${result.nModified} instructors updated with featured: false`);
        mongoose.disconnect(); // Close connection after the update
    } catch (err) {
        console.error('Error updating instructors:', err);
        mongoose.disconnect(); // Close connection on error
    }
}

updateInstructors();
