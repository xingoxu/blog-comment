/**
 * Created by xingo on 2017/03/27.
 */

let curryDAO = require('../utils/curryDAO.js');

let SQLQuotes = {
      getThreadLikes: `SELECT thread_likes FROM threads WHERE threads.thread_key = ?`,
      newThread: `INSERT INTO threads (thread_key,thread_url,thread_likes,thread_title) VALUES (?,?,0,?)`,
      threadEXIST: `SELECT thread_id FROM threads WHERE thread_key = ?`,
    },
    threadsTable = {
      /**
       * 获得文章喜欢
       * @param thread_key 文章key String
       * @returns {Promise.<Array>} thread_likes
       */
      getThreadLikes: curryDAO(SQLQuotes.getThreadLikes),
      /**
       * 新文章
       * @param thread_key
       * @param thread_url
       * @param thread_title
       * @returns {Promise}
       */
      newThread: curryDAO(SQLQuotes.newThread),
      /**
       * 文章是否存在
       * @param thread_key
       * @returns {Promise.<Boolean>}
       */
      threadEXIST: (() => {
        let curryFunc = curryDAO(SQLQuotes.threadEXIST);
        return function (thread_key) {
          return curryFunc(thread_key).then(result => {
            return result.length > 0 ? result[0].thread_id : false;
          })
        }
      })(),
    };

module.exports = threadsTable