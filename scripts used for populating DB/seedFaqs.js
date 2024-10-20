require('dotenv').config();
const mongoose = require('mongoose');
const Faq = require('../models/Faq');

mongoose.connect(process.env.MONGODB_URI);

const faqs = [
    {   question: 'How do I sign up as an instructor?',
            answer: 'To sign up as an instructor, click the "Sign Up" button on the home page and select "Instructor" during registration. Fill out your details, and you\'ll be able to start creating courses after account verification.' },
    {   question: 'Can I access the courses offline?',
            answer: 'Currently, offline access is not supported. However, you can bookmark courses to access them quickly whenever you have an internet connection.' },
    {   question: 'How can I reset my password?',
            answer: 'You can reset your password by clicking on "Forgot Password" on the login page. Enter your email, and we\'ll send you a link to reset your password.' },
    {   question: 'Are there any free courses available?',
            answer: 'Yes, we offer a selection of free courses available for learners. You can browse free courses by visiting the "Browse" section and filtering by "Free".' },
    {   question: 'How is the commission fee calculated for instructors?',
        answer: 'Instructors are charged a commission of 20% of the total course sales. The rest of the payment is transferred to the instructor\'s account.' },
    {   question: 'Can I cancel my premium membership anytime?',
            answer: 'Yes, you can cancel your premium membership anytime from your account settings. The membership will remain active until the end of the billing cycle.' },
];

Faq.insertMany(faqs)
    .then(() => {
        console.log('FAQs added successfully.');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error adding FAQs: ', err);
        mongoose.connection.close();
    });