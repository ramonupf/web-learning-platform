require('dotenv').config();
const mongoose = require('mongoose');
const Fee = require('../models/Fee');

mongoose.connect(process.env.MONGODB_URI);

const fees = [
    { type: 'Monthly Subscription', instructorFee: '50€', learnerFee: '20€' },
    { type: 'Commission Fee', instructorFee: '20% of Course Sales', learnerFee: 'N/A' },
    { type: 'Premium Membership', instructorFee: '100€/year', learnerFee: '80€/year' }
];

Fee.insertMany(fees)
    .then(() => {
        console.log('Fees addes successfully.');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error adding fees: ', err);
        mongoose.connection.close();
    });