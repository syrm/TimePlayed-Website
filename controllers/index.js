var express = require('express')
  , router = express.Router()


router.get('/', function(req, res) {
  res.header('X-FRAME-OPTIONS', 'ALLOW-FROM https://discordbots.org/');
  res.render('index');
})

router.get(/^\/commands(\.[^.]+)?$/, function(req, res) {
  res.render("commands");
})
router.get(/^\/faq-support(\.[^.]+)?$/, function(req, res) {
  res.render("faq-support");
})
router.get(/^\/terms-of-service(\.[^.]+)?$/, function(req, res) {
  res.render("terms-of-service");
})
router.get(/^\/getting-started(\.[^.]+)?$/, function(req, res) {
  res.render("getting-started");
})


router.use('/dashboard', require("./dashboard"))
// router.use('/profile', require("./profile"))

module.exports = router