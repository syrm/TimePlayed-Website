var express = require('express')
  , router = express.Router()
  , Profile = require('../models/profile')
  , Discord = require('../models/discord')


router.get("/", function(req, res) {
  Profile.random(function(randoms) {
    Discord.bulkUserInfo(randoms, function(randomUsers) {
      res.render("profile", {
        userInfo: req.session.userInfo,
        randomUsers: randomUsers
      })
    })
  })
})

router.get(/^\/([0-9]{17,18})\/?$/, function(req, res) {
  var id = req.params[0];
  Discord.botRequest(`users/${id}`, function(user) {
    if(user.code) {
      res.render("profile/not-found", {id: id, userInfo: req.session.userInfo})
    } else {
      Profile.checkPrivate(id, function(private) {
        if(private) {
          res.render("profile/private", {user: user, userInfo: req.session.userInfo})
        } else {
          Profile.topGames(id, req.query.since, function(topGames) {
            var totalHours = 0;
            topGames.forEach(obj => {
              totalHours += obj.time / 3600;
            })
            totalHours = Math.round(totalHours);
            res.render("profile/profile", {
              user: user,
              since: req.query.since,
              topGames: topGames,
              totalHours: totalHours,
              userInfo: req.session.userInfo
            })
          })
        }
      })
    }
  })
})

router.get("/me", function(req, res) {
  if(req.session.userInfo) {
    res.redirect(`/profile/${req.session.userInfo.id}`)
  } else {
    res.redirect("/login?redirect=/profile/me")
  }
})

module.exports = router