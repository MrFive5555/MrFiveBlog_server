var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var express = require('express');

var signinFunc = require('./function/signinFunc');
var blogFunc = require('./function/blogFunc');

var config = require('./config');
var mongoose = require('mongoose');
mongoose.connect(config.databaseUrl);

var app = express();
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());
app.use(express.static('../webpage/dist'));
app.use(cookieParser('mrfiveBlog'));
app.use(session({
  secret : 'mrfiveBlog',
  resave : true,
  saveUninitialized : true
}));

app.route('/')
  .get(function(req, res) {
    res.redirect('/index.html');
  });

app.route('/getUser').post(signinFunc.getUser);
app.route('/signin').post(signinFunc.signin);
app.route('/regist').post(signinFunc.regist);
app.route('/logout').post(signinFunc.logout);

app.route('/uploadBlog').post(blogFunc.uploadBlog);
app.route('/downloadBlog').post(blogFunc.downloadBlog);
app.route('/getBlogList').post(blogFunc.getBlogList);
app.route('/getReviewList').post(blogFunc.getReviewList);
app.route('/sendReview').post(blogFunc.sendReview);
app.route('/hideReview').post(blogFunc.hideReview);

app.use(function(req, res) {
  res.status(404).send('Sorry cant find that!');
});

var server = app.listen(8081, '127.0.0.1', function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('服务器开始运行，访问地址为 http://%s:%s', host, port);
});

