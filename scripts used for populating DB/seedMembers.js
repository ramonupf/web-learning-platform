require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('../models/Member');

mongoose.connect(process.env.MONGODB_URI);

//array of members:
const members = [
    {
        name: 'Ramon',
        photoUrl: '/images/ramon.jpg',
        bio: 'Detailed information about Ramon.',
        role: 'Developer'
    },
    {
        name: 'Alice',
        photoUrl: '/images/alice.jpg',
        bio: 'Detailed information about Alice.',
        role: 'Designer'
    },
    {
        name: 'Javier',
        photoUrl: '/images/javier.jpg',
        bio: 'Detailed information about Javier.',
        role: 'Project Manager'
    },
    {
        name: 'Michael',
        photoUrl: '/images/michael.jpg',
        bio: 'Detailed information about Michael.',
        role: 'UX designer'
    },
    {
        name: 'Priya',
        photoUrl: '/images/priya.jpg',
        bio: 'Detailed information about Priya.',
        role: 'Developer'
    }
];

Member.insertMany(members)
    .then(() => {
        console.log('Members added');
        mongoose.connection.close();
    })
    .catch(err => {
        console.log(err);
        mongoose.connection.close();
    });