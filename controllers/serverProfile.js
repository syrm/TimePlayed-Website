var express = require('express')
  , router = express.Router()
  , Playtime = require('../models/playtime')
  , Discord = require('../models/discord')


router.get("/", function(req, res) {
  res.render("serverProfile", {userInfo: req.session.userInfo})
})

router.get(/^\/([0-9]{17,18})\/?$/, function(req, res) {
  var id = req.params[0];
  var sessionUser = req.session.userInfo;
  Playtime.checkPremiumGuild(id, function(premium) {
    if(premium) {
      Discord.botRequest(`guilds/${id}`, function(guild) {
        if(guild.code) {
          res.render("serverProfile/invalid-server", {userInfo: req.session.userInfo})
        } else {
          Playtime.getServerGames(id, function(games) {
            if(req.query.game) {
              if(!games.includes(req.query.game)) {
                res.render("serverProfile/invalid-game", {
                  userInfo: req.session.userInfo,
                  games: games,
                  since: req.query.since
                })
              } else {
                res.send("Yes that's right!")
              }
              
            } else {
              Playtime.topGamesServer(id, req.query.minUsers, req.query.select, req.query.since, function(topGames) {
                var totalHours = 0;
                topGames.forEach(obj => {
                  totalHours += obj.time / 3600;
                })
                totalHours = Math.round(totalHours);
                res.render("serverProfile/no-game", {
                  userInfo: req.session.userInfo,
                  guild: guild,
                  topGames: topGames,
                  totalHours: totalHours,
                  selectFilter: req.query.select,
                  since: req.query.since,
                  minUsers: req.query.minUsers,
                  games: games
                });
              })
            }
          })
        }
      })
    } else {
      res.render("serverProfile/not-premium", {userInfo: req.session.userInfo})
    }
  })
  
  /* Discord.botRequest(`users/${id}`, function(user) {
    if(user.code) {
      res.render("userProfile/not-found", {id: id, userInfo: sessionUser})
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
  }) */
})

module.exports = router