const mongoose = require('mongoose');
const model = mongoose.model('quiz');

const shuffle = array => {
    array.sort(() => Math.random() - 0.5);
}

const shuffleQuestionsAndAnswers = quizzes => {
    for (let quiz of quizzes) {
        let questions = quiz.questions;
        shuffle(questions);
        const shuffled = questions.map(question => {
            const choices = [...question.choices, question.answer];
            shuffle(choices);
            return {
                _id: question._id,
                title: question.title,
                choices: choices
            }
        });
        quiz.questions = shuffled;
    }
}

const quizList = async(req, res) => {
    try {
        let quizzes;
        if (req.query.genres) {
            quizzes = await model.find({ genres: { $all: req.query.genres } });
        } else {
            quizzes = await model.find();
        }
        console.log(quizzes);
        shuffleQuestionsAndAnswers(quizzes);
        res
            .status(200)
            .json(quizzes);
    } catch (err) {
        res
            .status(404)
            .json(err);
    }
};

const createQuiz = (req, res) => {
    model.create(req.body,
        (err, quiz) => {
            if (err) {
                res
                    .status(400)
                    .json(err);
            } else {
                res
                    .status(201)
                    .json(quiz);
            }
        });
};

const readOneQuiz = (req, res) => {
    model
        .findById(req.params.quizId)
        .exec((err, quiz) => {
            if (!quiz) {
                return res
                    .status(404)
                    .json({ "message": "quiz not found" });
            } else if (err) {
                return res
                    .status(404)
                    .json(err);
            } else {
                return res
                    .status(200)
                    .json(quiz);
            }
        });
};

const attemptQuiz = (req, res) => {
    if (!req.params.quizId) {
        return res
            .status(404)
            .json({
                "message": "Not found, quizId is required"
            });
    }
    model
        .findById(req.params.quizId)
        .exec(async(err, quiz) => {
            if (!quiz) {
                return res
                    .status(404)
                    .json({
                        "message": "quizId not found"
                    });
            } else if (err) {
                return res
                    .status(400)
                    .json(err);
            }
            const answerAttempts = req.body.answers;
            const user = req.body.user;
            let score = 0;
            for (const answerAttempt of answerAttempts) {
                score = await saveQuestionAttempt(req, answerAttempt, user, score, res);
            }
            res
                .status(200)
                .json({ score });
        });
};

const deleteQuiz = (req, res) => {
    const { quizId } = req.params;
    if (quizId) {
        model
            .findByIdAndRemove(quizId)
            .exec((err, quiz) => {
                if (err) {
                    return res
                        .status(404)
                        .json(err);
                }
                res
                    .status(204)
                    .json(null);
            });
    } else {
        res
            .status(404)
            .json({
                "message": "No Quiz"
            });
    }
};

module.exports = {
    quizList,
    createQuiz,
    readOneQuiz,
    attemptQuiz,
    deleteQuiz
};

async function saveQuestionAttempt(req, answerAttempt, user, score, res) {
    await model.findOne({
        '_id': req.params.quizId
    }, {
        "questions": {
            "$elemMatch": {
                "_id": answerAttempt.questionId
            }
        },
    }).then(parentQuiz => {
        console.log("question", parentQuiz.questions[0]);
        const question = parentQuiz.questions[0];
        question.attempts.push({
            user: user,
            answer: answerAttempt.answer
        });
        if (answerAttempt.answer === question.answer) {
            score += 1;
        }
        parentQuiz.save();
    }).catch(err => {
        res
            .status(400)
            .json(err);
    });
    return score;
}