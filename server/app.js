var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

var config = require('./config');

var indexRouter = require('./routes/index');
var bookRouter = require('./routes/book');

var app = express();

app.use(cors()); // 跨域

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/book', bookRouter);

module.exports = app;
