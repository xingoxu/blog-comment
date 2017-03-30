var express = require('express');
var router = express.Router();
let errorProcess = require('../utils/error.js'),
  md5 = require('md5');  
let threadController = require('../dao/threads.js'),
  commentController = require('../dao/comments.js');
let CONST = require('../config/const.json');
let allowCrossDomain = require('../utils/setCrossDomain.js');

// transfer children comment to parent comment's children_comments key
// it can be done both frontend & backend
function commentTransform(result) {
  let comments = [], commentDict = {}, parentCommentDict = {};
  //comment_id, create_time, author_name,author_email,author_url,author_ua,parent_comment_id,text
  for (let i = 0; i < result.length; i++){
    let comment = result[i];
    comment.uid = comment.author_email ? md5(comment.author_email) : null;
    delete comment.author_email;
    commentDict[comment.comment_id] = comment;
    let comment_parent_comment_id = comment.parent_comment_id;
    if (comment_parent_comment_id) {
      if (!parentCommentDict[comment_parent_comment_id])
        parentCommentDict[comment_parent_comment_id] = [];
      parentCommentDict[comment_parent_comment_id].unshift(comment);
    }
    else {
      comments.push(comment);
    }
  }
  for (let post_key in parentCommentDict) {
    commentDict[post_key] && (commentDict[post_key].children_comments = parentCommentDict[post_key]);
  }
  return comments;
}

//get comments
//params: thread_key
router.get('/', allowCrossDomain, function (req, res, next) {
  let query = req.query;
  if (!query.thread_key || query.thread_key.trim().length <= 0)
    return errorProcess(next, 400, 'Bad Request');
  //DESC
  return commentController.getThreadComments(query.thread_key.trim()).then(result => {
    return res.json({
      comments: commentTransform(result),
      admin: md5(CONST.admin_mail)
    })
  }).catch(err => {
    next(err);
  });
});



function urlValid(url) {
  return /^https?:\/\/[^\s]+/.test(url);
}
function stringNotEmpty(data) {
  return data && data.trim && data.trim().length > 0;
}
function emailValid(email) {
  return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email);
}

/**
 * post comment
 * {
 *  thread_key: '',
 *  thread_url: '',
 *  thread_title: '',
 *  text: '',
 *  author_name: '',
 *  author_email: '',
 *  author_url: '',
 *  parent_comment_id: {Number}
 * }
 */
router.post('/', allowCrossDomain, (req, res, next) => {
  let json = req.body;
  let ua = req.get('user-agent'), ip = (req.get('X-Real-IP') || req.ip);
  if (!stringNotEmpty(json.thread_key) || json.thread_key.length > CONST.THREAD_KEY_MAX_LENGTH)
    return errorProcess(next, 400, 'Bad Request');
  if (!urlValid(json.thread_url) || json.thread_url.length > CONST.THREAD_URL_MAX_LENGTH)
    return errorProcess(next, 400, 'Bad Request');
  if (!stringNotEmpty(json.thread_title) || json.thread_title.length > CONST.THREAD_TITLE_MAX_LENGTH)
    return errorProcess(next, 400, 'Bad Request');
  if (!stringNotEmpty(json.author_name))
    return errorProcess(next, 400, 'Bad Request');
  if (!emailValid(json.author_email))
    return errorProcess(next, 400, '请正确填写邮箱');
  if (!(!json.author_url || (stringNotEmpty(json.author_url) && urlValid(json.author_url))))
    return errorProcess(next, 400, 'Bad Request');
  if (!stringNotEmpty(ua))
    return errorProcess(next, 400, 'Bad Request');
  if (!json.text)
    return errorProcess(next, 400, 'Bad Request');
  for (let key in json) {
    json[key].trim && (json[key] = json[key].trim());
  }
  
  if (json.text.length <= 0)
    return errorProcess(next, 400, '请不要发送空评论');
  if (json.text.length > CONST.COMMENT_MAX_LENGTH)
    return errorProcess(next, 400, `字数超过${CONST.COMMENT_MAX_LENGTH}个字了，可把你牛逼坏了，太能说了！`);
  commentController.sameIP_lastComment_time(ip).then(last_time => {
    if (last_time && Date.now() - last_time <= CONST.COMMENT_INTERVAL) {
      let err = new Error('你可真能说，才多少时间就又提交一次？服务器都无法追赶你的脚步了！');
      err.status = 400;
      return Promise.reject(err);
    }
  }).then(() => {
    if (json.parent_comment_id)
      return commentController.commentEXIST(json.parent_comment_id).then(exist => {
        if (!exist) {
          let err = new Error('Bad Request');
          err.status = 400;
          return Promise.reject(err);
        }
      });
  }).then(() => {
    return threadController.threadEXIST(json.thread_key);
  }).then(thread_id => {
    if (!thread_id)
      return threadController.newThread(json.thread_key, json.thread_url, json.thread_title).then(result => result.insertId);
    return thread_id;
  }).then(thread_id => {
    return commentController.newComment(
      json.text,
      thread_id,
      Date.now() + '',
      json.author_name,
      json.author_email,
      json.author_url,
      ip,
      ua,
      json.parent_comment_id);
  }).then(result => {
    // {
    //   "comment_id": 14,
    //   "text": "example"
    //   "create_time": "1469699009000",
    //   "author_name": "example",
    //   "author_url": "http://example.com/",
    //   "parent_comment_id": null,
    //   "uid": "298dd4508046fde72204a2eb0dda692a"
    // },
    res.json({
      comment_id: result.insertId,
      text: json.text,
      create_time: Date.now() + '',
      author_name: json.author_name,
      author_url: json.author_url,
      author_ua: ua,      
      parent_comment_id: json.parent_comment_id,
      uid: md5(json.author_email),
    });
  }).catch(err => {
    next(err);
  });
});

router.options('/', allowCrossDomain, (req, res, next) => {
  res.json({});
});

module.exports = router;
