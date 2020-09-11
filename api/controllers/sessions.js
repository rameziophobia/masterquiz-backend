const current_sessions = new Map();

const getNewSessionCode = (req, res) => {
    code = random6alphanum();
    while (current_sessions.has(code)) {
        code = random6alphanum();
    }
    current_sessions.set(code, 1)
    res
        .status(200)
        .json(code);
}

const random6alphanum = () => {
    return (Math.random().toString(36) + '00000000000000000').slice(2, 6 + 2)
}


module.exports = {
    getNewSessionCode
};