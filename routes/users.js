var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  req.session.test = "hello1";
  console.log(req.session.test);
  res.send('respond with a resource');
});

module.exports = router;
