var express = require('express')
  , router = express.Router()
  , Playtime = require('../models/playtime')
  , Discord = require('../models/discord')

var client = require("../middlewares/botClient").client

router.get("/", function(req, res) {
  Playtime.random(6, function(randoms) {
    Discord.bulkUserInfo(randoms, function(randomUsers) {
      Playtime.topGamesDb(7, function(topGamesWeek) {
        Playtime.topGamesDb(30, function(topGamesMonth) {
          res.render("userProfile", {
            userInfo: req.session.userInfo,
            randomUsers: randomUsers,
            topGamesWeek: topGamesWeek,
            topGamesMonth: topGamesMonth
          })
        })
      })
    })
  })
})

router.get(/^\/([0-9]{17,18})\/?$/, function(req, res) {
  var id = req.params[0];
  var sessionUser = req.session.userInfo;
  var user = client.users.get(id)
  if(!user) {
    res.render("userProfile/not-found", {id: id, userInfo: sessionUser})
  } else if(user.bot) {
    res.render("userProfile/bot", { userInfo: sessionUser})
  } else {
    Playtime.checkPrivate(id, function(private) {
      if(private && (!sessionUser || id != sessionUser.id)) {
        res.render("userProfile/private", {user: user, userInfo: sessionUser})
      } else {
        Playtime.topGames(id, req.query.since, req.query.select, function(topGames) {
          var totalHours = 0;
          topGames.forEach(obj => {
            totalHours += obj.time / 3600;
          })
          totalHours = Math.round(totalHours);
          Playtime.topDays(id, function(topDays) {
            res.render("userProfile/profile", {
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

router.get("/me", function(req, res) {
  if(req.session.userInfo) {
    res.redirect(`/profile/${req.session.userInfo.id}`)
  } else {
    res.redirect("/login?redirect=/profile/me")
  }
})

module.exports = router