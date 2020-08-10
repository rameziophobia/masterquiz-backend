const express = require('express');
const router = express.Router();
const ctrlQuizzes = require('../controllers/quizzes');

router
    .route('/quizzes')
    .get(ctrlQuizzes.quizList)
    .post(ctrlQuizzes.createQuiz);

router
    .route('/quizzes/:quizId')
    .get(ctrlQuizzes.readOneQuiz)
    .put(ctrlQuizzes.updateQuiz)
    .delete(ctrlQuizzes.deleteQuiz);

module.exports = router;