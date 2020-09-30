const ctrlQuizzes = require('../api/controllers/quizzes');
const mongoose = require('mongoose');
const model = mongoose.model('quiz');

class SessionModel {

    participants = [];
    answers = new Map();
    startQuizTimer;
    currentQuestionId;
    currentQuestionIndex = 0;
    currentQuestionTimeStart;
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
            //todo finishedQuiz
            //todo this is late 4000ms/7000ms
        } else {
            this.currentQuestionId = this.quiz.questions[index]._id;
            this.currentQuestionTimeStart = Date.now();
            this.workspace.emit('nextQuestion');
            this.questionTimer = setTimeout(() => {
                this.workspace.emit('allAnswered', this.currentQuestionAnswers);
                this.startQuestionTransition(index + 1);
            }, 30000);
        }
    }

    startQuestionTransition(index) {
        this.acceptingAnswers = false;
        setTimeout(() => {
            this.acceptingAnswers = true;
            this.startQuestions(index);
        }, 4000)
    }

    processAnswer(data, participant) {
        if (this.acceptingAnswers) {
            const currentQuestionAnswers = this.answers.get(String(this.currentQuestionId));
            const thisAnswer = { hash: participant.hash, answer: data, time: this.calculateTimeDiff() };
            try {
                currentQuestionAnswers.push(thisAnswer);
            } catch (e) {
                console.log('Error in processing answer (adding to current answers)');
                console.log(e.message);
                return;
            }
            this.workspace.emit('answerLocked', participant.hash);

            if (this.participants.length === currentQuestionAnswers.length) {
                clearTimeout(this.questionTimer);
                this.workspace.emit('allAnswered', currentQuestionAnswers);
                this.startQuestionTransition(this.currentQuestionIndex + 1);
            }
            console.log(this.answers)
        } else {
            console.log('not accepting answers now, transitioning questions')
        }
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