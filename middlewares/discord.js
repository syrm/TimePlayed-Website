const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');
const { catchAsync } = require('../utils');

const Discord = require('../models/discord')
const keys = require("../keys.json");
const router = express.Router();

const CLIENT_ID = keys.clientId;
const CLIENT_SECRET = keys.clientSecret;
const redirect = encodeURIComponent(keys.callbackUrl);

function guildPerms(guildPerms) {
  var perms = {
    generalCreateInstantInvite: 0x1,
    generalKickMembers: 0x2,
    generalBanMembers: 0x4,
    generalAdministrator: 0x8,
    generalManageChannels: 0x10,
    generalManageServer: 0x20,
    generalChangeNickname: 0x4000000,
    generalManageNicknames: 0x8000000,
    generalManageRoles: 0x10000000,
    generalManageWebhooks: 0x20000000,
    generalManageEmojis: 0x40000000,
    generalViewAuditLog: 0x80,
    textAddReactions: 0x40,
    textReadMessages: 0x400,
    textSendMessages: 0x800,
    textSendTTSMessages: 0x1000,
    textManageMessages: 0x2000,
    textEmbedLinks: 0x4000,
    textAttachFiles: 0x8000,
    textReadMessageHistory: 0x10000,
    textMentionEveryone: 0x20000,
    textUseExternalEmojis: 0x40000,
    voiceViewChannel: 0x400,
    voiceConnect: 0x100000,
    voiceSpeak: 0x200000,
    voiceMuteMembers: 0x400000,
    voiceDeafenMembers: 0x800000,
    voiceMoveMembers: 0x1000000,
    voiceUseVAD: 0x2000000,
    voicePrioritySpeaker: 0x100
  };
  var currPerms = [];
  Object.keys(perms).forEach(permName => {
    var permValue = perms[permName];
    if(guildPerms & permValue) {
      currPerms.push(permName);
    }
  })
  return currPerms.includes("generalManageServer");
}

router.get('/login', (req, res) => {
  if(req.query.redirect) {
    req.session.redirect = req.query.redirect;
  }
  res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify%20guilds&response_type=code&redirect_uri=${redirect}`);
});

router.get('/callback', catchAsync(async (req, res) => {
  if (!req.query.code || req.query.error) {
    return res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify%20guilds&response_type=code&redirect_uri=${redirect}`);
  }
  const code = req.query.code;
  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const response = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
      },
    });
  const json = await response.json();
  var token = json.access_token;
  req.session.discordToken = token;
  Discord.getUserInfo(token, function(userInfo) {
    req.session.userInfo = userInfo;
    Discord.getUserGuilds(token, function(userGuilds) {
      userGuilds = userGuilds.filter(e => {return guildPerms(e.permissions)});
      req.session.userGuilds = userGuilds;
      if(req.session.redirect) {
        res.redirect(decodeURIComponent(req.session.redirect));
      } else {
        res.redirect('/')
      }
    });
  })
}));

router.get('/logout', (req, res) => {
  req.session.discordToken = undefined;
  req.session.userGuilds = undefined;
  req.session.userInfo = undefined;
  var url = decodeURIComponent(req.query.redirect);
  var reg = /^\/dashboard\/([0-9]{18})\/?(general|leaderboard|role-awards)?$/;
  if(req.query.redirect && !url.match(reg)) {
    res.redirect(url);
  } else if(url.match(reg)) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/')
  }
});

router.post('/update-info', (req, res) => {
  token = req.session.discordToken;
  if(!token) return res.render("");
  Discord.getUserInfo(token, function(userInfo) {
    req.session.userInfo = userInfo;
    Discord.getUserGuilds(token, function(userGuilds) {
      if(!userGuilds.message) {
        userGuilds = userGuilds.filter(e => {return guildPerms(e.permissions)});
        req.session.userGuilds = userGuilds;
      }
      res.render("");
    });
  })
});

module.exports = router;