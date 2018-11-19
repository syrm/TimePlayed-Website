var express = require('express')
  , router = express.Router()
  , Dashboard = require('../models/dashboard')
  , Discord = require('../models/discord')

router.get('/', function(req, res) {
  userGuilds = req.session.userGuilds;
  res.render('dashboard', {
    guilds: userGuilds,
    url: req.originalUrl
  })
})

router.get(/^\/([0-9]{18})\/?(general|leaderboard|role-awards)?$/, function(req, res) {
  var guildID = req.params[0];
  var page = req.params[1];
  if(!page) page = "server-index";

  var userGuilds = req.session.userGuilds;

  if(userGuilds) {
    Dashboard.getConfig(guildID, function(guildConf) {
      if(!guildConf) {
        return res.redirect(`https://discordapp.com/oauth2/authorize?client_id=433625399398891541&scope=bot&permissions=268708928&guild_id=${req.params[0]}`);
      }
      Dashboard.checkPremium(guildID, function(premium) { 
        if(page == "leaderboard") {
          Discord.botRequest(`guilds/${guildID}/channels`, function(channels) {
            // Only send text channels
            channels = channels.filter(e => {return e.type == 0});
            res.render(`dashboard/leaderboard`, {
              guildConf: guildConf,
              url: req.originalUrl,
              id: guildID,
              guilds: userGuilds,
              premium: premium,
              channels: channels
            })
          })
        } else if(page == "role-awards") {
          Dashboard.getRoleAwards(guildID, function(roleAwards) {
            Discord.botRequest(`guilds/${guildID}`, function(roles) {
              roles = roles["roles"];
              roles.sort((a, b) => {return b.position - a.position});
              Discord.botRequest(`guilds/${guildID}/members/433625399398891541`, function(botMember) {
                var highestBotPos = 0;
                roles.forEach(role => {
                  if(botMember.roles.includes(role.id) && role.position > highestBotPos) {
                    highestBotPos = role.position
                  }
                })
                var botPerms = roles.filter(e => {return e.position == highestBotPos})[0].permissions
                var manageRoles = Discord.permList(botPerms).includes("generalManageRoles");
                var roleOptions = "<option value='' selected disabled>- Select role -</option>";
                roles.forEach(role => {
                  var disabled = "";
                  if(role.position >= highestBotPos) disabled = " disabled"
                  roleOptions += `<option value=${role.id}${disabled}>${role.name}</option>`
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
                  manageRoles: manageRoles
                })
              })
            })
          })
        } else {
          res.render(`dashboard/${page}`, {
            guildConf: guildConf,
            url: req.originalUrl,
            id: guildID,
            guilds: userGuilds,
            premium: premium
          })
        }
      })
    })
  } else {
    res.redirect(`/dashboard`);
  }
})

module.exports = router