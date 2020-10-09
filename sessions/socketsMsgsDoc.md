# Socketio Messages Documentation

## Messages emited by the Backend

all signals are sent to the frontend to

* nextQuestion  
    move to the next question  

* allAnswered  
    everyone has answered the current question or the question timer timed out, returns the list of answers with the correct answer if it werent included  
    params:  
    [{ hash: string,  
    answer: string,  
    time: number,  
    user: string,  
    score: number,  
    isCorrect: boolean},]

* answerLocked  
    someone locked a question answer, resignals to the rest

* oldParticipants  
    when someone enters, it is sent the list of the older participants  
    params: [  
        { name: string,  
        isReady: boolean,  
        hash : string ,  
        answerLocked: boolean},  
     ]

* participantAdded  
    when someone enters his object is sent to all participants  
    params: {  
        name: string,  
        isReady: boolean,  
        hash : string ,  
        answerLocked: boolean}

* msg  
    used for the chat  
    params: string

* toggleReady  
    received when a participant toggles his ready checkmark, resignaled to everyone

* startQuizCountdown  
    signaled when everyone is ready

* cancelQuizCountdown  
    signaled when ready is set to false or someone joins

* startQuiz  
    signaled after the starting timer finishes if noone cancelled it

## Messages received by the Backend

* answer  
    when a participant sends his question answer  
    params: string

* sendQuizId
    received when a new waiting room is created  
    params: quizId (string)
* addParticipant
* msg
* toggleReady
