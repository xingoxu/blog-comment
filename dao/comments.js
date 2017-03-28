/**
 * Created by xingo on 2017/03/27.
 */

let curryDAO = require('../utils/curryDAO.js');

let SQLQuotes = {
      getThreadComments: `SELECT comment_id, create_time, author_name,author_email,author_url,parent_comment_id FROM threads,comments WHERE comments.thread_id = threads.thread_id AND threads.thread_key = ? ORDER BY create_time+0 DESC`,
      newComment: `INSERT INTO comments (text,thread_id,create_time,author_name,author_email,author_url,author_ip, author_ua ,parent_comment_id) VALUES (?,?,?,?,?,?,?,?,?)`,
      commentEXIST: `SELECT count(1) as count FROM comments WHERE comment_id = ?`,
      sameIP_lastComment_time:`SELECT create_time FROM comments WHERE author_ip = ? ORDER BY create_time+0 DESC LIMIT 1`,
    },
    commentsTable = {
      /**
       * 获得文章评论
       * @param thread_key 文章key String
       * @returns {Promise.<Array>} comment_id, create_time, author_name,author_email,author_url,parent_comment_id
       */
      getThreadComments: curryDAO(SQLQuotes.getThreadComments),
      /**
       * 新评论
       * @param text
       * @param thread_id
       * @param create_time
       * @param author_name
       * @param author_email
       * @param author_url
       * @param author_ip
       * @param author_ua
       * @param parent_comment_id
       * @returns {Promise}
       */
      newComment: curryDAO(SQLQuotes.newComment),
      /**
       * 评论是否存在
       * @param comment_id
       * @returns {Promise.<Boolean>}
       */
      commentEXIST: (() => {
        let curryFunc = curryDAO(SQLQuotes.commentEXIST);
        return function (comment_id) {
          return curryFunc(comment_id).then(result => {
            return result[0].count > 0;
          })
        }
      })(),
      /**
       * 上一条由此ip发出的评论的时间
       * @param ip
       * @returns {Promise.<Number>} timestamp
       */
      sameIP_lastComment_time:(() => {
        let curryFunc = curryDAO(SQLQuotes.commentEXIST);
        return function (ip) {
          return curryFunc(ip).then(result => {
            return Number.parseInt(result[0].create_time);
          })
        }
      })(),

    };
module.exports = commentsTable;