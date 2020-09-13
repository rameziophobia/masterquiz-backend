const ctrlQuizzes = require('../api/controllers/quizzes');
const mongoose = require('mongoose');
const model = mongoose.model('quiz');

module.exports = (io) => {

    const participants = new Map();
    let startQuizTimer;
    let quiz;

    const workspaces = io.of(/^\/session\/[a-zA-Z0-9]+$/)
        .on('connection', (socket) => {
            const workspace = socket.nsp;
            console.log(`user connected to ${workspace.name}`);
            console.log('number of connected clients: ' + Object.keys(workspace.sockets).length)
            socket.on('answer', (data) => {
                console.log(data);
                //todo handle answer?
            });

            socket.on('sendQuizId', (quizId) => {
                readOneQuiz(quizId);
            })

            socket.on('addParticipant', (data) => {
                console.log(data);

                if (!participants.has(workspace.name)) {
                    participants.set(workspace.name, []);
                }
                console.log("parts" + participants.get(workspace.name));
                socket.emit('oldParticipants', participants.get(workspace.name));
                participants.get(workspace.name).push(data)
                workspace.emit('participantAdded', data);
                clearTimeout(startQuizTimer);
            });


            socket.on('msg', (data) => {
                console.log(data);
                //todo handle msg?
                workspace.emit('msg', data);
            });


            socket.on('toggleReady', (hash) => {
                const participant = participants.get(workspace.name)
                    .find(participant => participant.hash === hash);
                participant.isReady = !participant.isReady;
                workspace.emit('toggleReady', hash);
                clearTimeout(startQuizTimer);
                startQuizIfAllready(workspace);
            });


            workspace.emit('msg', `hello ${workspace.name}`);
        });

    const startQuizIfAllready = (workspace) => {
        if (areAllReady(participants.get(workspace.name))) {
            workspace.emit('startQuizAnimation'); //todo
            startQuizTimer = setTimeout(() => {
                workspace.emit('startQuiz');
                // participants.set(workspace.name, []);
            }, 5000);
        } else {

            console.log('not all ready');
        }
    }

    const areAllReady = (workspace_participants) => {
        return workspace_participants
            .every(participant => participant.isReady);
    }
};

const readOneQuiz = (quizId) => {
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
                quiz = q;
                console.log(quiz);
            }
        });
}

//todo ppl reset connection ama yod5olo el quiz