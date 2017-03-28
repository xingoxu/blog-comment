/**
 * Created by xingo on 2017/03/26.
 */
var connectionPool = require('mysql').createPool({
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: process.env.MYSQL_PORT
});
var cb = function (err) {
  if (err)
    throw err;
};
var path = require('path'),
    fs = require('fs');
connectionPool.query(fs.readFileSync(path.resolve(__dirname, '../create_table_sql/threads.sql'), {encoding: 'utf8'}), cb
)
;
connectionPool.query(fs.readFileSync(path.resolve(__dirname, '../create_table_sql/comments.sql'), {encoding: 'utf8'}), cb);
module.exports = connectionPool;