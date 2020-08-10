const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('./api/models/db');

const apiRouter = require('./api/routes/index');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', apiRouter);

module.exports = app;