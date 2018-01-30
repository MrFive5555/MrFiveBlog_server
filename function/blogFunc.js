var mongoose = require('mongoose');
var account = require('./account');
var config = require('../config');

// mongoose.connect(config.databaseurl);

var Blog = mongoose.model('Blog', {
  title : String,
  content : String,
  date : Date,
  tags : Array
});

var Review = mongoose.model('Review', {
  title : String,
  userName : String,
  content : String,
  date : Date,
  hidden : Boolean
});

module.exports = {
  connect(url) {
    mongoose.connect(url);
  },
  uploadBlog(req, res) {
    Blog.find({title : req.body.title})
      .then((result) => {
        if(result.length != 0) {
          return undefined;
        } else {
          var newBlog = new Blog({
            title : req.body.title,
            content : req.body.content,
            date : req.body.date,
            tags : req.body.tags
          });
          return newBlog.save();
        }
      })
      .then((obj) => { // save成功返回成功插入的对象
        if(!obj) {
          res.send(false);
        } else {
          console.log(`[发表博客](${new Date()})${obj.title}`);
          res.send(true);
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).end();
      });
    
  },
  downloadBlog(req, res) {
    Blog.find({title : req.body.title})
      .then((result) => {
        if(result.length == 0) {
          res.status(404).end(); // 找不到相应的博客
        } else if(result.length != 1) { // 有重名博客
          res.status(500).end();
        } else {
          res.send(result[0]);
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).end();
      });
  },
  getBlogList(req, res) {
    Blog.find({}, {title : 1, date : 1, _id : 0})
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.log(err);
        res.status(404).end();
      });
  },
  getReviewList(req, res) {
    var userName = req.session.user ? req.session.user.userName : undefined;
    Promise.all([
      Review.find({title : req.body.title}, {__v : 0})
        .sort({date:-1}),
      account.isAdmin(userName)
    ])
      .then(([result, isAdmin]) => {
        // 不是管理员,被隐藏的评论无法显示
        if(!isAdmin) { 
          for(let rev of result) {
            if(rev.hidden) {
              rev.content = '评论内容已被隐藏';
            }
          }
        }
        res.send(result);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).end();
      });
  },
  sendReview(req, res) {
    if(!req.session.user) {
      res.end();
    } else {
      if(req.body.content.length == 0) {
        res.status(403.1).end();
      } else if(req.body.content.length > 200) {
        res.status(403.1).end();
      } else {
        req.body._id = undefined;
        req.body.userName = req.session.user.userName;
        var newReivew = new Review(req.body);
        newReivew
          .save()
          .then((obj) => {
            res.send(obj._id);
            console.log(`[用户]${req.session.user.userName}发表评论,评论id:${obj._id}`);
          })
          .catch((err) => {
            console.log(err);
            res.status(500).end();
          });
      }
    }
  },
  hideReview(req, res) {
    if(!req.session.user) {
      res.send(false);
    } else {
      account.isAdmin(req.session.user.userName)
        .then((isAdmin) => {
          if(!isAdmin) {
            res.send(false);
            return;
          }
          Review.update(
            {_id : req.body._id},
            {$set:{'hidden':req.body.hidden}})
            .then((obj) => {
              console.log(`[${obj.hidden ? '隐藏' : '显示'}评论] _id : ${req.body._id}`);
              res.send(true);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).end();
            });
        });
    }
  }
};
