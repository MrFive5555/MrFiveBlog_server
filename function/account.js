var mongoose = require('mongoose');

//mongoose模板
var Account = mongoose.model('Account', {
  userName : String,
  id : String,
  phone : String,
  email : String,
  password : String,
  isAdmin : Boolean
});
var account = require('../buildinAccount');
var addBuildinAccount = function(name, pwd, isAdmin) {
  Account.find({userName : name}, function(err, result) {
    if(err) {
      console.error(err);
    } else if(result.length == 0) {
      new Account({
        userName : name,
        id : '00000000',
        phone : '00000000',
        email : '00000000',
        password : pwd,
        isAdmin : isAdmin
      }).save(function(err, res) {
        if(err) {
          console.error(err);
        } else {
          console.log('[新增账号]', res);
        }
      });
    }
  });
};
addBuildinAccount(account.adminName, account.adminPassword, true);
addBuildinAccount(account.guestName, account.guestPassword, false);


module.exports = {
  connect : function(url) {
    mongoose.connect(url);
  },
  //接受一组资料,判断是否合法
  validator : function (account) {
    var userName = account.userName;
    var id = account.id;
    var phone = account.phone;
    var email = account.email;
    var password = account.password;
    var repeatPassword = account.repeatPassword;
    console.log(account);
    var where = {
      $or : [
        {'userName' : userName},
        {'id' : id},
        {'phone' : phone},
        {'email' : email}
      ]
    };

    return new Promise((resolve, reject) => {
      Account.find(where)
        .then((result) => {
          if(result.length != 0) {// 有重复
            var duplicate = {
              userName : false,
              id : false,
              phone : false,
              email : false
            };
            var contents = ['userName', 'id', 'phone', 'email'];
            for(let j in result) {
              for(let content of contents) {
                if(result[j][content] == account[content]) {
                  duplicate[content] = true;
                }
              }
            }
            resolve(duplicate); //validator操作失败
          } else { //无重复
            var patt_name = /^[a-zA-Z]\w{5,17}/;
            var patt_id = /^[1-9][0-9]{7}$/;
            var patt_tel = /^[1-9][0-9]{10}$/;
            var patt_mail = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
            var patt_password = /^[\w_-]{6,12}$/;
      
            console.log(password === repeatPassword);
            if(patt_name.test(userName)
              && patt_id.test(id)
              && patt_tel.test(phone)
              && patt_mail.test(email)
              && patt_password.test(password)
              && password == repeatPassword) {
              resolve('valid');
            } else {
              resolve('invalid');
            }
          }
        })
        .catch((err) => { //搜索操作失败
          console.error(err);
          reject();
        });
    });
  },
  //添加用户
  add : function(account) {
    return new Promise((resolve, reject) => {
      var newAccount = new Account({
        userName : account.userName,
        id : account.id,
        phone : account.phone,
        email : account.email,
        password : account.password,
        isAdmin : false
      });
      newAccount.save(function(err, res) {
        if(err) {
          console.error(err);
          reject();
        } else {
          console.log('[新增账号]',res);
          resolve();
        }
      });
    });
  },
  //验证密码是否正确
  correctPassword : function(userName_in, password_in) {
    return new Promise((resolve, reject) => {
      //find的第一个参数是where,第二个参数是过滤掉部分键的过滤器
      Account.find({
        userName : userName_in,
        password : password_in
      },
      {password : 0, _id : 0, __v : 0})
        .then((result) => {
          if(result.length == 0) {
            resolve(undefined);
          } else if(result.length == 1) {
            resolve(result[0]);
          } else {
            reject();
          }
        })
        .catch((err) => {
          console.log(err);
          reject();
        });
    });
  },
  //获得用户信息
  getInfo : function(_userName) {
    return new Promise((resolve, reject) => {
      Account.find(
        {userName : _userName},
        {password : 0, _id : 0, __v : 0},
        function(err, result) {
          if(err) {
            console.error(err);
            reject();
          } else {
            if(result.length != 1) {
              reject(new Error('没有此用户,或有重名用户'));
            } else {
              resolve(result[0]);
            }
          }
        });
    });
  },
  // 判断是否为管理员
  isAdmin : function(_userName) {
    return new Promise((resolve, reject) => {
      if(!_userName) {
        resolve(false);
      } else {
        Account.find({userName : _userName}, {isAdmin : 1})
          .then(function(result) {
            if(result.length != 1) {
              reject(new Error('没有此用户,或有重名用户'));
            } else {
              resolve(result[0].isAdmin);
            }
          })
          .catch(function(err) {
            reject(err);
          });
      }
    });
  }
};