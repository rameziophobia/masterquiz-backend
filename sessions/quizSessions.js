const ctrlQuizzes = require('../api/controllers/quizzes');
const mongoose = require('mongoose');
const model = mongoose.model('quiz');
const QUESTION_ANSWER_INTERVAL = 30000;

class SessionModel {

    participants = [];
    answers = new Map();
    participantNames = new Map();
    startQuizTimer;
    currentQuestionId;
    currentQuestionIndex = 0;
    currentQuestionTimeStart;
    currentQuestionAnswers = []
    questionTimer;
    quizId;
    acceptingAnswers = true;

    _quiz;
    workspace;

    set quiz(q) {
        this._quiz = q;
        this.setupQuiz();
    }

    get quiz() {
        return this._quiz;
    }

    constructor(workspace) {
        this.workspace = workspace;
    }

    clearStartTimeout() {
        this.workspace.emit('cancelQuizCountdown');
        clearTimeout(this.startQuizTimer);
    }

    areAllReady() {
        return this.participants
            .every(participant => participant.isReady);
    }

    startQuiz() {
        this.startQuestions();
    }

    setupQuiz() {
        for (const question of this.quiz.questions) {
            this.answers.set(String(question._id), []);
        }
        console.log('quiz got setupped')
    }

    startQuestions(index = 0) {
        this.currentQuestionIndex = index;
        if (index >= this.quiz.questions.length) {
            console.log('finished quiz');

            this.saveToDB();
            sessionModels.delete(this.workspace.name);
        } else {
            this.currentQuestionId = this.quiz.questions[index]._id;
            this.currentQuestionCorrectAnswer = this.quiz.questions[index].answer;
            this.currentQuestionTimeStart = Date.now();
            this.workspace.emit('nextQuestion');
            this.questionTimer = setTimeout(() => {
                this.addEmptyAnswers();
                this.workspace.emit('allAnswered', this.currentQuestionAnswers);
                this.startQuestionTransition(index + 1);
            }, QUESTION_ANSWER_INTERVAL);
        }
    }

    addEmptyAnswers() {
        let answeredParticipants = this.currentQuestionAnswers.map(a => a.hash);
        const timedOutParticipants = this.participants.filter(
            participant => !answeredParticipants.includes(participant.hash));
        console.log(timedOutParticipants);
        console.log(this.participants);
            for (const participant of timedOutParticipants) {
            const attempt = {
                user: participant.name,
                answer: " ",
                time: -1,
                score: 0,
                isCorrect: false
            };
            console.log(attempt);
            this.currentQuestionAnswers.push(attempt);
        }
    }

    saveToDB() {
        console.log("saving quiz attempts to db");
        model
            .findById(this.quizId)
            .exec(async(err, quiz) => {
                if (!quiz) {
                    return { "message": "quiz not found" };
                } else if (err) {
                    return { "message": "quiz not found, error with the DB" };
                } else {
                    console.log('quiz found');
                    this.addAnswerAttemptsToQuiz(quiz);
                    quiz.timesAnswered = quiz.questions[0].attempts.length;
                    try {
                        await quiz.save();
                    } catch {
                        return { "message": "could not save quiz attempt to DB" };
                    }
                    console.log("saving quiz attempts to db succeeded");
                }
            });
    }

    addAnswerAttemptsToQuiz(quiz) {
        for (const [questionId, answerObjs] of this.answers) {
            const dbQuestion = quiz.questions.find(
                question => String(question._id) == String(questionId));
            for (const answerObj of answerObjs) {
                dbQuestion.attempts.push(answerObj);
            }
        }
    }

    calculateAnswerScore(time, isCorrect) {
        return (100 + (QUESTION_ANSWER_INTERVAL / 1000) - time) * isCorrect;
    }

    startQuestionTransition(index) {
        this.acceptingAnswers = false;
        const answerStrings = this.currentQuestionAnswers.map(ans => ans.answer);
        const uniqueAnswers = new Set(answerStrings);
        uniqueAnswers.add(this.currentQuestionCorrectAnswer)
        const displayAnswersAnimationTime = uniqueAnswers.size * 2700;
        setTimeout(() => {
            this.acceptingAnswers = true;
            this.startQuestions(index);
        }, displayAnswersAnimationTime)
    }

    processAnswer(data, participant) {
        if (this.acceptingAnswers) {
            try{
                this.currentQuestionAnswers = this.answers.get(String(this.currentQuestionId));
                const hasParticipantAnswered = this.currentQuestionAnswers.findIndex(
                    answer => answer.hash == participant.hash) != -1;
                if(hasParticipantAnswered){
                    return;
                }
            }
            catch(e){
                console.log('Error in processing answer', e.message);
                return;
            }

            const isCorrect = data == this.currentQuestionCorrectAnswer;
            const time = this.calculateTimeDiff();
            const thisAnswer = {
                hash: participant.hash,
                answer: data,
                time: time,
                user: this.participantNames.get(participant.hash),
                score: this.calculateAnswerScore(time, isCorrect),
                isCorrect: isCorrect
            };
            try {
                this.currentQuestionAnswers.push(thisAnswer);
            } catch (e) {
                console.log('Error in processing answer (adding to current answers)');
                console.log(e.message);
                return;
            }
            this.workspace.emit('answerLocked', participant.hash);
            if (this.participants.length === this.currentQuestionAnswers.length) {
                clearTimeout(this.questionTimer);
                if(this.currentQuestionAnswers.every(ans => !ans.isCorrect)){
                    this.addCorrectAnswer(this.currentQuestionAnswers); 
                }
                this.workspace.emit('allAnswered', this.currentQuestionAnswers);
                this.startQuestionTransition(this.currentQuestionIndex + 1);
            }
            console.log(this.answers)
        } else {
            console.log('not accepting answers now, transitioning questions')
        }
    }

    addCorrectAnswer(currentQuestionAnswers){
        currentQuestionAnswers.push({
            hash: '-1',
            answer: this.quiz.questions[this.currentQuestionIndex].answer,
            time: -1,
            user: '-1',
            score: -1,
            isCorrect: true
        })
    }

    calculateTimeDiff = () => {
        const startTime = this.currentQuestionTimeStart;
        const endTime = Date.now();
        let timeDiff = endTime - startTime; //in ms 
        // strip the ms 
        timeDiff /= 1000;
        // get seconds 
        const seconds = Math.round(timeDiff);
        console.log(seconds + " seconds");
        return seconds;
    };

    addParticipantName(hash, name) {
        this.participantNames.set(hash, name);
    }
}

const sessionModels = new Map();

module.exports = (io) => {

    const workspaces = io.of(/^\/session\/[a-zA-Z0-9]+$/)
        .on('connection', (socket) => {
            let thisParticipant;
            const workspace = socket.nsp;
            console.log(`user connected to ${workspace.name}`);
            console.log('number of connected clients: ' + Object.keys(workspace.sockets).length)

            socket.on('answer', (data) => {
                if (sessionModels.has(workspace.name)) {
                    const session = sessionModels.get(workspace.name);
                    session.processAnswer(data, thisParticipant);
                }
            });

            socket.on('sendQuizId', (quizId) => {
                readOneQuiz(quizId, workspace);
            })

            socket.on('addParticipant', (data) => {
                thisParticipant = data;

                if (!sessionModels.has(workspace.name)) {
                    sessionModels.set(workspace.name, new SessionModel(workspace));
                }

                const session = sessionModels.get(workspace.name);
                const participants = session.participants;

                console.log("parts" + participants);
                socket.emit('oldParticipants', participants);

                participants.push(data)

                workspace.emit('participantAdded', data);

                session.addParticipantName(data.hash, data.name);
                session.clearStartTimeout();
            });


            socket.on('msg', (data) => {
                console.log(data);
                //todo handle msg?
                workspace.emit('msg', data);
            });


            socket.on('toggleReady', (hash) => {
                if (sessionModels.has(workspace.name)) {
                    const participant = sessionModels.get(workspace.name).participants
                        .find(participant => participant.hash === hash);

                    participant.isReady = !participant.isReady;
                    workspace.emit('toggleReady', hash);
                    sessionModels.get(workspace.name).clearStartTimeout();
                    startQuizIfAllready(workspace);
                } else {
                    console.log('trying to toggle ready for a non existant workspace')
                }
            });


            workspace.emit('msg', `hello ${workspace.name}`);
        });

    const startQuizIfAllready = (workspace) => {
        if (sessionModels.has(workspace.name) && sessionModels.get(workspace.name).areAllReady()) {
            workspace.emit('startQuizCountdown');
            const session = sessionModels.get(workspace.name);
            const startQuizDelay = 5000;
            session.startQuizTimer = (setTimeout(() => {
                workspace.emit('startQuiz');
                sessionModels.get(workspace.name).startQuiz();
            }, startQuizDelay));
        }
    }
};

const readOneQuiz = (quizId, workspace) => {
    console.log(quizId)
    model
        .findById(quizId)
        .exec((err, q) => {
            if (!q) {
                console.log('1')
                return { "message": "quiz not found" };
            } else if (err) {
                console.log('2')
                return { "message": "quiz not found" };
            } else {

                console.log('3')
                const session = sessionModels.get(workspace.name);
                session.quiz = q;
                session.quizId = quizId;
                console.log(session.quiz.name);
            }
        });
}

//todo ppl reset connection ama yod5olo el quiz