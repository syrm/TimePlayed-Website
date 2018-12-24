var mysql = require('mysql')
var keys = require('../keys');
var connection = mysql.createPool({
  connectionLimit : 20,
  host     : keys.mysqlhost,
  user     : keys.mysqluser,
  password : keys.mysqlpasswd,
  database : 'timeplayed',
  supportBigNumbers: true
});

var Discord = require("./discord")

// Privacy

exports.checkPrivate = function(userID, callback) {
  connection.query("SELECT count(*) FROM privateUsers WHERE userID=? ", [userID], function(error, results, fields) {
    var private = results[0]["count(*)"] > 0;
    return callback(private);
  })
}

exports.checkPremiumGuild = function(id, callback) {
  connection.query("SELECT COUNT(*) AS count FROM premium WHERE guildID=?", [id, id], function(error, results, fields) {
    callback(results[0].count > 0)
  })
}

exports.checkServerPrivacy = function(guildID, callback) {
  connection.query("SELECT value FROM guildPrivacy WHERE guildID=?", [guildID], function(error, results, fields) {
    var value = 1;
    if(results[0]) value = results[0].value
    callback(value);
  })
}

exports.checkServerAccess = function(value, guildID, userInfo, userGuilds, callback) {
  if(value == 0) {
    // Open for everyone
    callback(true);
  } else if(value == 1) {
    // Only for server members
    if(userInfo) {
      Discord.botRequest(`guilds/${guildID}/members/${userInfo.id}`, function(result) {
        if(result.message) {
          callback(false);
        } else {
          callback(true);
        }
      })
    } else {
      callback(false);
    }
  } else if(value == 2) {
    // Only for server moderators
    if(userGuilds && userGuilds.filter(e => e.id == guildID)[0] && Discord.permList(userGuilds.filter(e => e.id == guildID)[0].permissions).includes("generalManageServer")) {
      callback(true);
    } else {
      callback(false);
    }
  }
}

exports.setGuildPrivacy = function(id, value, callback) {
  connection.query("INSERT INTO guildPrivacy (guildID, value) VALUES(?, ?) ON DUPLICATE KEY UPDATE value=?", [id, value, value], function(error, results, fields) {
    callback();
  })
}

// Without games

exports.topGames = function(id, since, selectFilter, callback) {
  var gameFilter = ""
  if(selectFilter == "noSoftware") gameFilter = "AND game NOT IN (SELECT game FROM knownGames WHERE type=2)"
  if(selectFilter == "noGames") gameFilter = "AND game NOT IN (SELECT game FROM knownGames WHERE type=1)"
  if(selectFilter == "gamesOnly") gameFilter = "AND game IN (SELECT game FROM knownGames WHERE type=1)"
  if(selectFilter == "softwareOnly") gameFilter = "AND game IN (SELECT game FROM knownGames WHERE type=2)"
  var sinceFilter = ""
  if(since) sinceFilter = "AND startDate > ?"
  var q = `
  SELECT
    game,
      SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time
  FROM
      playtime
  WHERE
      userID = ?
      ${sinceFilter}
      ${gameFilter}
  GROUP BY game
  ORDER BY time DESC`
  if(since) since = new Date(since)
  connection.query(q, [id, since], function(error, games, fields) {
    connection.query("SELECT game, iconURL FROM knownGames WHERE iconURL IS NOT NULL AND game IN (?)", [games.map(e => {return e.game})], function(error, results, fields) {
      games.forEach((game, i) => {
        var iconResult = results.filter(e => {return e.game == game.game})
        if(iconResult[0] && iconResult[0].iconURL) games[i].iconURL = iconResult[0].iconURL
      })
      return callback(games)
    })
  })
}

exports.topGamesServer = function(id, minimalPlayers, selectFilter, since, callback) {
  var gameFilter = ""
  if(selectFilter == "noSoftware") gameFilter = "AND game NOT IN (SELECT game FROM knownGames WHERE type=2)"
  if(selectFilter == "noGames") gameFilter = "AND game NOT IN (SELECT game FROM knownGames WHERE type=1)"
  if(selectFilter == "gamesOnly") gameFilter = "AND game IN (SELECT game FROM knownGames WHERE type=1)"
  if(selectFilter == "softwareOnly") gameFilter = "AND game IN (SELECT game FROM knownGames WHERE type=2)"
  var sinceFilter = ""
  if(since) sinceFilter = "AND startDate > ?"
  var q = `
  SELECT
    game,
    SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time,
    COUNT(DISTINCT userID) AS count
  FROM
      guildStats
  WHERE
      guildID = ?
      ${sinceFilter}
      ${gameFilter}
  GROUP BY game
  ORDER BY time DESC`
  if(since) since = new Date(since)
  connection.query(q, [id, since], function(error, games, fields) {
    if(minimalPlayers) games = games.filter(e => e.count >= minimalPlayers)
    connection.query("SELECT game, iconURL FROM knownGames WHERE iconURL IS NOT NULL AND game IN (?)", [games.map(e => {return e.game})], function(error, results, fields) {
      games.forEach((game, i) => {
        var iconResult = results.filter(e => {return e.game == game.game})
        if(iconResult[0] && iconResult[0].iconURL) games[i].iconURL = iconResult[0].iconURL
      })
      callback(games);
    })
  })
}

exports.topDays = function(id, callback) {
  var q = `
  SELECT
    DATE_FORMAT(startDate, '%W') AS day,
    SUM(TIMESTAMPDIFF(SECOND, startDate, endDate)) / 4 AS time
  FROM playtime
    WHERE userID=?
    AND startDate > NOW() - INTERVAL 4 WEEK
  GROUP BY DATE_FORMAT(startDate, '%W')
  ORDER BY time DESC`
  connection.query(q, [id], function(error, results, fields) {
    callback(results);
  })
}

// With games

exports.timePlayedServer = function(id, game, since, callback) {
  var sinceFilter = ""
  if(since) sinceFilter = "AND startDate > ?"
  var q = `SELECT 
  SUM(TIMESTAMPDIFF(HOUR, startDate, IFNULL(endDate, NOW()))) AS time
  FROM
    guildStats
  WHERE
    guildID = ?
    AND game = ?
    ${sinceFilter}`
  if(since) since = new Date(since)
  connection.query(q, [id, game, since], function(error, playtime, fields) {
    connection.query("SELECT iconURL FROM knownGames WHERE game=? AND iconURL IS NOT NULL", [game], function(error, iconResults, fields) {
      var icon;
      if(iconResults[0]) icon = iconResults[0].iconURL;
      callback([playtime[0].time, icon])
    })
  })
}

exports.topUsers = function(id, game, callback) {
  var q = `
  SELECT
    userID,
    SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time
  FROM
    playtime
  WHERE
    game=?
    AND userID IN (SELECT DISTINCT userID FROM guildStats WHERE guildID=?)
      AND userID IN (SELECT userID FROM termsAccept WHERE accept=1)
      AND userID NOT IN (SELECT userID FROM privateUsers)
  GROUP BY userID
  ORDER BY time DESC`
  connection.query(q, [game, id], function(error, topUsers, fields) {
    Discord.bulkUserInfo(topUsers.map(e => e.userID), function(userInfos) {
      topUsers.forEach(user => {
        var userInfo = userInfos.filter(e => e.id == user.userID)
        if(userInfo[0]) user.username = userInfo[0].username
      })
      callback(topUsers);
    })
  })
}

exports.gameChart = function(id, game, callback) {
  var q = `
  SELECT
    TIMESTAMPDIFF(DAY,(SELECT startDate FROM guildStats WHERE guildID=? AND game=? ORDER BY startDate LIMIT 1), startDate) + 1 AS day,
    SUM(TIMESTAMPDIFF(MINUTE, startDate, IFNULL(endDate, NOW()))) AS time
  FROM guildStats
  WHERE
    guildID=?
      AND game=?
  GROUP BY TIMESTAMPDIFF(DAY,(SELECT startDate FROM guildStats WHERE guildID=? AND game=? ORDER BY startDate LIMIT 1), startDate)`
  connection.query(q, [id, game, id, game, id, game], function(error, results, fields) {
    connection.query(`SELECT startDate FROM guildStats WHERE guildID=? AND game=? ORDER BY startDate LIMIT 1`, [id, game], function(error, date, fields) {
      callback([results, date[0].startDate]);
    })
  })
}

// Other

exports.random = function(amount, callback) {
  amountPlus = amount + 2;
  connection.query("SELECT userID FROM timeplayed.playtime WHERE startDate BETWEEN DATE_SUB(NOW(), INTERVAL 3 DAY) AND NOW() AND `userID` NOT IN (SELECT userID FROM timeplayed.privateUsers) ORDER BY RAND() LIMIT ?", [amountPlus], function(error, results, fields) {
    if(results.length > 0) results = results.map(e => e.userID)
    results = results.filter(function(item, pos, self) {
      return self.indexOf(item) == pos;
    })
    results.splice(amount);
    callback(results);
  })
}

exports.topGamesDb = function(sinceDays, callback) {
  connection.query("SELECT game, players, iconURL, hours FROM topGames WHERE since=?", [sinceDays], function(error, results, fields) {
    callback(results);
  })
}

exports.getServerGames = function(id, callback) {
  connection.query("SELECT DISTINCT game FROM guildStats WHERE guildID=?", [id], function(error, results, fields) {
    callback(results.map(e => e.game))
  })
}