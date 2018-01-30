var account = require('./account');

module.exports = {
  getUser(req, res) {
    if(req.session.user) {
      account.getInfo(req.session.user.userName)
        .then((result) => {
          res.send(result);
        })
        .catch((err) => {
          console.log(err);
          res.status(500).end();
        });
    } else {
      res.end();
    }
  },
  signin(req, res) {
    account.correctPassword(req.body.userName, req.body.password)
      .then((userInfo) => {
        if(userInfo) {
          req.session.user = {
            'userName' : req.body.userName
          };
        }
        res.send(userInfo);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).end();
      });
  },
  regist(req, res) {
    account.validator(req.body)
      .then((validator) => {
        if(validator === 'invalid') {
          res.send(validator); // 表单验证未通过
        } else if(typeof(validator) === 'object') {
          res.send(validator); // 有重复
        } else if(validator === 'valid') {
          account.add(req.body)
            .then(() => {
              req.session.user = {
                'userName' : req.body.userName
              };
              res.send(validator);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).end();
            });
        } else {
          console.log('unknown result in /regist');
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).end();
      });
  },
  logout(req, res) {
    req.session.user = undefined;
    res.status(200).end();
  }

};