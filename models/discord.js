var request = require('request');
var keys = require('../keys.json')

exports.botRequest = function(path, callback) {
  request.get(`https://discordapp.com/api/${path}`, {
    headers: {
      'authorization': `Bot ${keys.botToken}`
    }
  }, function (error, response, body) {
    callback(JSON.parse(body))
  });
}

exports.getUserInfo = function(token, callback) {
  if(!token) return callback(false);
  request.get('https://discordapp.com/api/v6/users/@me', {
    'auth': {
      'bearer': token
    }
  }, function (error, response, body) {
    callback(JSON.parse(body))
  });
}

exports.getUserGuilds = function(token, callback) {
  if(!token) return callback(false);
  request.get('https://discordapp.com/api/v6/users/@me/guilds', {
    'auth': {
      'bearer': token
    }
  }, function (error, response, body) {
    callback(JSON.parse(body))
  });
}

exports.permList = function(num) {
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
    if(num & permValue) {
      currPerms.push(permName);
    }
  })
  return currPerms;
}