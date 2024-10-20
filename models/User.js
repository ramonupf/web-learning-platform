const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Please enter a valid email.']},
    phone: {type: String, required: true, match: [/^\d{9,10}$/, 'Please enter a valid phone number.']},
    password: {type: String, required: true},
    profilePicture: {type: String, required: false}, //allow create user without profile picture to rename file
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    address: {type: String, required: true},
    city: {type: String, required: true},
    zipcode: {type: String, required: true, match: [/^\d{4,6}$/, 'Please enter a valid zipcode.']},
    country: {type: String, required: true},
    accountType: {type: String, enum: ['Instructor', 'Learner', 'Admin'],required: true},
    //for instructors:
    schoolName: {type: String},
    jobTitle: {type: String},
    specialization: { type: [String], required: false },
    featured: {type: Boolean, default: false},
    //others:
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], // For instructors
    coursesEnrolled: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        enrollmentStartDate: Date,
        enrollmentEndDate: Date  // Expiry date for 7-day access
    }],
    trialCourses: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        trialEndDate: Date,
        trialActive: { type: Boolean, default: true }
    }],
    //password recovery:
    resetPasswordToken: { type: String },  // Token for resetting password
    resetPasswordExpires: { type: Date },  // Expiration time for the token
}, { timestamps: true });

//password hashing using a middleware
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {  // if it's modified, we encrypt it
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;