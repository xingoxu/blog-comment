/**
 * Created by xingo on 2017/03/27.
 */
var connectionPool = require('../modules/mysql-connection.js');

/**
 * 柯里化，用于符合相同逻辑SQL，变成Promise
 * @param SQLQuotes sql string
 * @returns {Function}
 */
module.exports = function (SQLQuotes) {
  if (!SQLQuotes)
    throw new Error('No SQLQuotes!');
  return function () {
    let argumentsArray = Array.prototype.slice.call(arguments);
    let promise = new Promise((resolve, reject) => {
      connectionPool.getConnection((err, connection) => {
        if (err)
          return reject(err);
        function queryFunc(err, result) {
          if (err)
            reject(err);
          else
            resolve(result);
          connection.release();
        }

        if (argumentsArray.length > 0)
          connection.query(SQLQuotes, argumentsArray, queryFunc);
        else
          connection.query(SQLQuotes, queryFunc);
      })
    });
    return promise;
  }
};