const mongoose = require('mongoose');


const questionAttemptSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    time: {
        type: Number,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
    }
});

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    choices: {
        type: [String],
        // validate: v => v == null || v.length > 0 // at least 1 false choice ?
    },
    attempts: [questionAttemptSchema]
});

const quizSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        'default': Date.now
    },
    timesAnswered: {
        type: Number,
        'default': 0
    },
    genres: [String],
    rating: {
        type: Number,
        required: false,
        min: 0,
        max: 5
    },
    author: {
        type: String,
        required: false
    },
    questions: {
        type: [questionSchema],
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

mongoose.model('quiz', quizSchema);