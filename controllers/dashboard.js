var express = require('express')
  , router = express.Router()
  , Dashboard = require('../models/dashboard')

  var client = require("../middlewares/botClient").client

router.get('/', function(req, res) {
  userGuilds = req.session.userGuilds;
  res.render('dashboard', {
    guilds: userGuilds,
    url: req.originalUrl,
    userInfo: req.session.userInfo
  })
})

router.get(/^\/([0-9]{17,18})\/?(general|leaderboard|role-awards)?$/, function(req, res) {
  var guildID = req.params[0];
  var page = req.params[1];
  if(!page) page = "server-index";

  var userGuilds = req.session.userGuilds;

  if(userGuilds && userGuilds.map(e => {return e.id}).includes(guildID)) {
    Dashboard.getConfig(guildID, function(guildConf) {
      if(!guildConf) {
        return res.redirect(`https://discordapp.com/oauth2/authorize?client_id=433625399398891541&scope=bot&permissions=268708928&guild_id=${req.params[0]}`);
      }
      Dashboard.checkPremium(guildID, function(premium) {
        var guild = client.guilds.get(guildID);
        if(!guild) res.send("This server seems to be deleted! Please sign out and sign in again")
        if(page == "leaderboard") {
          // Only send text channels
          var channels = guild.channels;
          channels = channels.filter(e => {return e.type == "text" && e.deleted != true && guild.me.permissionsIn(e).has(["READ_MESSAGES", "SEND_MESSAGES", "MANAGE_MESSAGES"])});
          res.render(`dashboard/leaderboard`, {
            guildConf: guildConf,
            url: req.originalUrl,
            id: guildID,
            guilds: userGuilds,
            premium: premium,
            channels: channels,
            userInfo: req.session.userInfo
          })
        } else if(page == "role-awards") {
          Dashboard.getRoleAwards(guildID, function(roleAwards) {
            var roles = guild.roles.sort((a, b) => b.position - a.position);

            var highestBotRole = guild.me.roles.sort(function(a, b) {
              return b.position - a.position
            }).first()

            var manageRoles = guild.me.permissions.has("MANAGE_ROLES");
            var roleOptions = "<option value='' selected disabled>- Select role -</option>";
            roles.forEach(role => {
              if(role.position < 1) return;
              var disabled = "";
              var colorStr = `style='color: ${role.hexColor}'`
              if(role.position >= highestBotRole.position) {
                disabled = " disabled"
                colorStr = ""
              }
              roleOptions += `<option ${colorStr} value=${role.id}${disabled}>${role.name}</option>`
            })
            res.render(`dashboard/role-awards`, {
              guildConf: guildConf,
              url: req.originalUrl,
              id: guildID,
              guilds: userGuilds,
              premium: premium,
              roleAwards: roleAwards,
              guildRoles: roles,
              roleOptions: roleOptions,
              manageRoles: manageRoles,
              userInfo: req.session.userInfo
            })
          })
        } else {
          res.render(`dashboard/${page}`, {
            guildConf: guildConf,
            url: req.originalUrl,
            id: guildID,
            guilds: userGuilds,
            premium: premium,
            userInfo: req.session.userInfo
          })
        }
      })
    })
  } else if(userGuilds && !userGuilds.map(e => {return e.id}).includes(guildID)) {
    res.redirect('/dashboard');
  } else {
    res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
})

module.exports = router