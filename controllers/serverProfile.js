var express = require('express')
  , router = express.Router()
  , Playtime = require('../models/playtime')
  , Discord = require('../models/discord')

var client = require("../middlewares/botClient").client

router.get("/", function(req, res) {
  res.render("serverProfile", {userInfo: req.session.userInfo})
})

router.get(/^\/([0-9]{17,18})\/?$/, function(req, res) {
  var id = req.params[0];
  var sessionUser = req.session.userInfo;
  var manageServer = false;
  var userGuilds = req.session.userGuilds
  if(userGuilds && userGuilds.filter(e => e.id == id)[0] && Discord.permList(userGuilds.filter(e => e.id == id)[0].permissions).includes("generalManageServer")) {
    manageServer = true;
  }
  Playtime.checkPremiumGuild(id, function(premium) {
    if(premium) {
      // If the server is premium
      Playtime.checkServerPrivacy(id, function(privacy) {
        Playtime.checkServerAccess(privacy, id, req.session.userInfo, req.session.userGuilds, function(access) {
          if(access) {
            var guild = client.guilds.get(id);
              if(!guild) {
                // If TimePlayed is not in the server
                res.render("serverProfile/invalid-server", {userInfo: sessionUser})
              } else {
                Playtime.getServerGames(id, function(games) {
                  if(req.query.game) {
                    // If there's a game selected
                    if(!games.includes(req.query.game)) {
                      // If game is invalid
                      res.render("serverProfile/invalid-game", {
                        userInfo: sessionUser,
                        games: games,
                        since: req.query.since
                      })
                    } else {
                      // If there game is valid
                      Playtime.timePlayedServer(id, req.query.game, req.query.since, function(totalHours) {
                        Playtime.topUsers(id, req.query.game, function(topUsers) {
                          Playtime.gameChart(id, req.query.game, function(gameChart) {
                            res.render("serverProfile/with-game", {
                              userInfo: sessionUser,
                              guild: guild,
                              since: req.query.since,
                              games: games,
                              game: req.query.game,
                              totalHours: totalHours[0],
                              iconURL: totalHours[1],
                              manageServer: manageServer,
                              topUsers: topUsers,
                              gameChart: gameChart
                            })
                          })
                        })
                      })
                    }
                  } else {
                    // If there's no game
                    Playtime.topGamesServer(id, req.query.select, req.query.since, function(topGames) {
                      var totalHours = 0;
                      topGames.forEach(obj => {
                        totalHours += obj.time / 3600;
                      })
                      totalHours = Math.round(totalHours);
                      res.render("serverProfile/no-game", {
                        userInfo: sessionUser,
                        guild: guild,
                        topGames: topGames,
                        totalHours: totalHours,
                        selectFilter: req.query.select,
                        since: req.query.since,
                        minUsers: req.query.minUsers,
                        games: games,
                        manageServer: manageServer
                      });
                    })
                  }
                })
              }
          } else if(privacy == 1 || privacy == 2) {
            res.render("serverProfile/no-access", {
              userInfo: sessionUser,
              privacy: privacy
            })
          } else {
            res.send("Sorry, something went wrong. Please try again later.")
          }
        })
      })
    } else {
      // If the server isn't premium
      res.render("serverProfile/not-premium", {userInfo: sessionUser})
    }
  })
  
  
  
})

module.exports = router