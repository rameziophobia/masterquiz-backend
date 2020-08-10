const mongoose = require('mongoose');
const model = mongoose.model('quiz');

const quizList = async(req, res) => {
    try {
        let results;
        if (req.query.genres) {
            results = await model.find({ genres: { $all: req.query.genres } });
        } else {
            results = await model.find();
            console.log(results);
        }

        res
            .status(200)
            .json(results);
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
            // genres: req.body.genres.split(","), //todo cannot split 3alla undefined
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

const updateQuiz = (req, res) => {
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
    updateQuiz,
    deleteQuiz
};