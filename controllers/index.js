var express = require('express')
  , router = express.Router()

var Playtime = require('../models/playtime')

router.get('/', function(req, res) {
  Playtime.getUserCount(function(userCount) {
    res.render('index', {
      userInfo: req.session.userInfo,
      userCount: userCount
    });
  })
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


// router.use('/profile', require("./userProfile"))
router.get(/^\/profile\/?.*?/, function(req, res) {
  res.send("Sorry, this page is temporarily unavavailable. Click <a href='/'>here</a> to return to the home page.")
})

module.exports = router