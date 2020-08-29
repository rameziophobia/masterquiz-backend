const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('./api/models/db');

const apiRouter = require('./api/routes/index');

const app = express();

const addHeaders = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}

app.use(addHeaders);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', apiRouter);

module.exports = app;