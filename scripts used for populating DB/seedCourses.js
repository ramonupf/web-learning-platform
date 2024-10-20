// seedCategories.js
require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course'); 
const User = require('../models/User');
const Category = require('../models/Category');

mongoose.connect(process.env.MONGODB_URI);
async function seedCourses() {
    try {
      // Get some instructor IDs and category IDs to reference
      const instructors = await User.find({ accountType: 'Instructor' }).limit(3); // Get 3 instructors for variety
      const categories = await Category.find(); // Get all categories
  
      if (instructors.length < 1 || categories.length < 5) {
        console.log("Not enough instructors or categories to seed courses.");
        process.exit();
      }
  
      const courses = [
        {
          name: 'Introduction to Programming',
          price: 49.99,
          description: 'A beginner course on programming fundamentals.',
          image: '/uploads/course-pictures/introduction_to_programming.jpg',
          instructors: [instructors[0]._id],
          categories: [categories[2]._id],  // Programming category
          featured: true  // This course is featured
        },
        {
          name: 'Advanced Science Experiments',
          price: 69.99,
          description: 'Explore advanced scientific concepts with real experiments.',
          image: '/uploads/course-pictures/advanced_science_experiments.jpg',
          instructors: [instructors[1]._id],
          categories: [categories[1]._id],  // Science category
          featured: false
        },
        {
          name: 'Business Fundamentals',
          price: 89.99,
          description: 'A comprehensive guide to starting and running a business.',
          image: '/uploads/course-pictures/business_fundamentals.jpg',
          instructors: [instructors[2]._id],
          categories: [categories[4]._id],  // Business category
          featured: true  // This course is featured
        },
        {
          name: 'Mathematics for Engineers',
          price: 59.99,
          description: 'Learn advanced mathematics concepts tailored for engineering students.',
          image: '/uploads/course-pictures/mathematics_for_engineers.jpg',
          instructors: [instructors[0]._id],
          categories: [categories[0]._id],  // Math category
          featured: false
        },
        {
          name: 'Digital Art Mastery',
          price: 99.99,
          description: 'Master digital art techniques using the latest tools.',
          image: '/uploads/course-pictures/digital_art_mastery.jpg',
          instructors: [instructors[2]._id],
          categories: [categories[3]._id],  // Arts category
          featured: true  // This course is featured
        },
        {
          name: 'Web Development Masterclass',
          price: 120.00,
          description: 'Learn how to build modern websites from scratch.',
          image: '/uploads/course-pictures/web_development_masterclass.jpg',
          instructors: [instructors[1]._id],
          categories: [categories[2]._id],  // Programming category
          featured: true  // This course is featured
        },
        {
          name: 'Introduction to Artificial Intelligence',
          price: 129.99,
          description: 'Dive deep into AI and machine learning techniques.',
          image: '/uploads/course-pictures/introduction_to_artificial_intelligence.jpg',
          instructors: [instructors[0]._id],
          categories: [categories[1]._id, categories[2]._id],  // Science and Programming categories
          featured: false
        },
        {
          name: 'Creative Writing Workshop',
          price: 59.99,
          description: 'Improve your creative writing skills with hands-on exercises.',
          image: '/uploads/course-pictures/creative_writing_workshop.jpg',
          instructors: [instructors[2]._id],
          categories: [categories[3]._id],  // Arts category
          featured: false
        }
      ];
  
      // Remove any existing data (optional)
      await Course.deleteMany();
  
      // Insert new courses
      await Course.insertMany(courses);
      console.log('Courses seeded successfully');
      process.exit();
  
    } catch (err) {
      console.error('Error seeding courses:', err);
      process.exit(1);
    }
  }
  
  seedCourses();