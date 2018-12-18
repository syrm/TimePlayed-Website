var express = require('express')
  , router = express.Router()
  , Profile = require('../models/profile')
  , Discord = require('../models/discord')


router.get("/", function(req, res) {
  Profile.random(6, function(randoms) {
    Discord.bulkUserInfo(randoms, function(randomUsers) {
      Profile.topGamesDb(7, function(topGamesWeek) {
        Profile.topGamesDb(1, function(topGamesDay) {
          res.render("profile", {
            userInfo: req.session.userInfo,
            randomUsers: randomUsers,
            topGamesWeek: topGamesWeek,
            topGamesDay: topGamesDay
          })
        })
      })
    })
  })
})

router.get(/^\/([0-9]{17,18})\/?$/, function(req, res) {
  var id = req.params[0];
  var sessionUser = req.session.userInfo;
  Discord.botRequest(`users/${id}`, function(user) {
    if(user.code) {
      res.render("profile/not-found", {id: id, userInfo: sessionUser})
    } else {
      Profile.checkPrivate(id, function(private) {
        if(private && (!sessionUser || id != sessionUser.id)) {
          res.render("profile/private", {user: user, userInfo: sessionUser})
        } else {
          Profile.topGames(id, req.query.since, req.query.select, function(topGames) {
            var totalHours = 0;
            topGames.forEach(obj => {
              totalHours += obj.time / 3600;
            })
            totalHours = Math.round(totalHours);
            Profile.topDays(id, function(topDays) {
              res.render("profile/profile", {
                user: user,
                since: req.query.since,
                topGames: topGames,
                totalHours: totalHours,
                topDays: topDays,
                userInfo: sessionUser,
                selectFilter: req.query.select,
                private: private
              })
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