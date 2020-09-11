const express = require('express');
const router = express.Router();
const ctrlQuizzes = require('../controllers/quizzes');
const ctrlSession = require('../controllers/sessions');

router
    .route('/quizzes')
    .get(ctrlQuizzes.quizList)
    .post(ctrlQuizzes.createQuiz);

router
    .route('/quizzes/:quizId')
    .get(ctrlQuizzes.readOneQuiz)
    .put(ctrlQuizzes.attemptQuiz)
    .delete(ctrlQuizzes.deleteQuiz);

router
    .route('/sessionCode')
    .get(ctrlSession.getNewSessionCode)

module.exports = router;