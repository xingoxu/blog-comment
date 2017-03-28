module.exports = function (next, code, message) {
  var err = new Error(message || 'Internal Error');
  err.status = code || 500;
  next(err);
};