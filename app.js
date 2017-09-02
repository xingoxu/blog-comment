var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
app.get('env') !== 'development' ? app.disable('x-powered-by') : false;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
//trust proxy setup
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])

app.get('env') === 'development' ? app.use(logger('dev')) : false;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/comments', require('./routes/comments'));
// app.use('/duoshuo', require('./routes/importDuoshuo'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  err.status != 404 ? console.error(err) : console.error(req.originalUrl);
  var errorMessage = {message: err.message};

  res.status(err.status || 500);
  req.app.get('env') === 'development' ? (errorMessage.stack = err.stack) : false;
  res.json(errorMessage);
});

module.exports = app;
