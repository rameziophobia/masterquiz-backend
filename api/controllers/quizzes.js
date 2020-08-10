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
    model.create({
            name: req.body.name,
            author: req.body.author,
            genres: req.body.genres,
            questions: req.body.questions
        },
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
                    .json(location);
            }
        });
};

const attemptQuiz = (req, res) => {
    // todo
    if (!req.params.quizId) {
        return res
            .status(404)
            .json({
                "message": "Not found, quizId is required"
            });
    }
    model
        .findById(req.params.quizId)
        // .select('-x -y')
        .exec((err, quiz) => {
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
            quiz.author = req.body.author;
            quiz.save((err, quiz) => {
                if (err) {
                    res
                        .status(404)
                        .json(err);
                } else {
                    res
                        .status(200)
                        .json(quiz);
                }
            });
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