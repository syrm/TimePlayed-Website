var express = require('express')
  , router = express.Router()


router.get('/', function(req, res) {
  res.render('index', {
    userInfo: req.session.userInfo
  });
})

router.get(/^\/commands(\.[^.]+)?$/, function(req, res) {
  res.render("commands", {
    userInfo: req.session.userInfo
  });
})
router.get(/^\/faq-support(\.[^.]+)?$/, function(req, res) {
  res.render("faq-support", {
    userInfo: req.session.userInfo
  });
})
router.get(/^\/terms-of-service(\.[^.]+)?$/, function(req, res) {
  res.render("terms-of-service", {
    userInfo: req.session.userInfo
  });
})
router.get(/^\/getting-started(\.[^.]+)?$/, function(req, res) {
  res.render("getting-started", {
    userInfo: req.session.userInfo
  });
})


router.use('/dashboard', require("./dashboard"))
router.use('/profile', require("./userProfile"))
router.use('/server', require("./serverProfile"))

module.exports = router