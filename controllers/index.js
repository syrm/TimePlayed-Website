var express = require('express')
  , router = express.Router()



router.get('/', function(req, res) {
  res.render('index');
})

var staticPages = [
  "commands",
  "faq-support",
  "terms-of-service",
  "getting-started"
]

staticPages.forEach(page => {
  router.get('/' + page, function(req, res) {
    res.render(page);
  })
})


router.use('/dashboard', require("./dashboard"))
router.use('/profile', require("./profile"))

module.exports = router