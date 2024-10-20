const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
    type:{
        type: String,
        required: true
    },
    instructorFee: {
        type: String,
        required: true
    },
    learnerFee: {
        type: String,
        required: true
    },
});

const Fee = mongoose.model('Fee', FeeSchema);

module.exports = Fee;