var mysql = require('mysql')
var keys = require('../keys');
var fs = require('fs');
var connection = mysql.createConnection({
  host     : keys.mysqlhost,
  user     : keys.mysqluser,
  password : keys.mysqlpasswd,
  database : 'timeplayed',
  supportBigNumbers: true,
  charset: "utf8mb4"
});

connection.connect();

exports.getConfig = function(guildID, callback) {
  connection.query("SELECT * FROM guildSettings WHERE guildID=?", [guildID], function(error, results, fields) {
    if (error) return callback(error)
    if(results.length < 1) return callback()
    var first = results[0]
    var obj = {
      prefix: first.prefix,
      rankingChannel: first.rankingChannel,
      defaultGame: first.defaultGame,
      leaderboardLayout: first.leaderboardLayout || fs.readFileSync('./public/plain/default-leaderboard.txt'),
      leaderboardNoMoreToday: first.leaderboardNoMoreToday || "No more users have played %game% today!",
      leaderboardNoMoreWeek: first.leaderboardNoMoreWeek || "No more users have played %game% this week!",
      leaderboardNoMoreAlways: first.leaderboardNoMoreAlways || "No more users have ever played %game%!",
      leaderboardNoToday: first.leaderboardNoToday || "No one has played %game% today!",
      leaderboardNoWeek: first.leaderboardNoWeek || "No one has played %game% this week!",
      leaderboardNoAlways: first.leaderboardNoAlways || "No one has ever played %game%!"
    }
    callback(obj);
  })
}

function secondsToString(num, simple) {
  w = Math.floor(num / 60 / 60 / 24 / 7);
  d = Math.floor(num / 86400);
  num -= d * 86400;
  h = Math.floor(num / 3600) % 24;
  num -= h * 3600;
  m = Math.floor(num / 60) % 60;
  
  if(w > 0) {
      if(simple && w == 1) {
          return "week";
      } else {
          return w + "w";
      }
  }
  if(d > 0) {
      if(simple && d == 1) {
          return "day";
      } else {
          return d + "d";
      }
  }
  if(h > 0) {
      if(simple && h == 1) {
          return "hour";
      } else {
          return h + "h";
      }
  }
  if(m > 0) {
      if(simple && m == 1) {
          return "minute";
      } else {
          return m + "m";
      }
  }
}

exports.getRoleAwards = function(guildID, callback) {
  connection.query("SELECT roleID, game, time, per FROM roleAwards WHERE guildID=?", [guildID], function(error, results, fields) {
    if(!results || results.length < 1) return callback([])
    var awards = [];
    results.forEach(result => {
      awards.push({
        roleID: result.roleID,
        game: result.game,
        time: secondsToString(result.time),
        per: secondsToString(result.per, true)
      })
    })
    callback(awards);
  })
}

exports.checkPremium = function(guildID, callback) {
  connection.query("SELECT guildID FROM premium WHERE guildID=?", [guildID], function(error, results, fields) {
    callback(results.length > 0);
  })
}