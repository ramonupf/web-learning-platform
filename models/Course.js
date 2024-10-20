const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
    name: {type: String, required: true},
    price: { type: Number, required: true },
    description: {type: String, required: true},
    image: {type: String, required: true},
    instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    categories: [{type: mongoose.Schema.Types.ObjectId, ref: 'Category'}],
    featured: { type: Boolean, default: false },  // featured course, default is FALSE
    //add learners enrolled?
}, { timestamps: true });  // enable timestamps to filter by new courses

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;