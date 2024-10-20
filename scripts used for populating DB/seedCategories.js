// seedCategories.js
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

mongoose.connect(process.env.MONGODB_URI);
const categories = [
    { name: 'Math' },
    { name: 'Science' },
    { name: 'Programming' },
    { name: 'Arts' },
    { name: 'Business' },
];

async function seedCategories() {
    try {
        await Category.insertMany(categories);
        console.log('Categories have been seeded');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding categories:', error);
        mongoose.connection.close();
    }
}

seedCategories();