/**
 * Created by xingo on 2017/03/27.
 */
var express = require('express');
var router = express.Router();
let threadController = require('../dao/threads.js'),
  commentController = require('../dao/comments.js');
let errorProcess = require('../utils/error.js'),
  JSONbig = require('json-bigint');  



router.post('/', require('body-parser').text() ,function (req, res, next) {
  var json;
  try {
    json = JSONbig.parse(req.body);
  }
  catch (e) {
    e.status = 400;
    return next(e);
  }
  var threadPromise = Promise.resolve();
  if (Array.isArray(json.threads)) {
    threadPromise = Promise.all(json.threads.map(thread => {
      return threadController.threadEXIST(thread.thread_key).then(thread_id => {
        if (!thread_id) {
          return threadController.newThread(
            thread.thread_key,
            (thread.url && thread.url != '') ? thread.url : null,
            (thread.title && thread.title != '') ? thread.title : null);
        }
      })
    })).catch(err => console.log(err));
  }
  if (Array.isArray(json.posts)) {
    let parentPostDict = {}, postDict = {};
    for (let i = 0; i < json.posts.length; i++){
      let post = json.posts[i];
      postDict[post.post_id] = post;
      if (!(post.parents && post.parents.length > 0)) {
        continue;
      }
      let post_parent_id = post.parents[post.parents.length - 1];
      if (!parentPostDict[post_parent_id]) {
        parentPostDict[post_parent_id] = [];
      }
      parentPostDict[post_parent_id].push(post);
      json.posts.splice(i, 1);
      i--;
    }
    for (let post_key in parentPostDict) {
      postDict[post_key].children_comments = parentPostDict[post_key];
    }
    
    threadPromise = threadPromise.then(() => {
      return Promise.all(json.posts.map(post => {
        return threadController.threadEXIST(post.thread_key).then(thread_id => {
          return thread_id ? thread_id : threadController.newThread(post.thread_key, null, null).then(result => { return result.insertId });
        }).then((thread_id) => {
          function newComment(parent_post, parent_comment_id) {
            return commentController.newComment(
              parent_post.message,
              thread_id,
              (new Date(parent_post.created_at)).valueOf() + '',
              parent_post.author_name,
              parent_post.author_email,
              parent_post.author_url,
              parent_post.ip,
              null,
              parent_comment_id
            ).then(result => {
              if (parent_post.children_comments && parent_post.children_comments.length > 0) {
                return Promise.all(parent_post.children_comments.map(child_comment => { return newComment(child_comment, result.insertId) }));
              }
            })
          }
          return newComment(post);
        }).catch(err => console.log(err));
      }));
    });
  }
  threadPromise.then(() => {
    res.json({
      success: true,
    })
  });
});

module.exports = router;