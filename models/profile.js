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

exports.checkPrivate = function(userID, callback) {
  connection.query("SELECT count(*) FROM privateUsers WHERE userID=? ", [userID], function(error, results, fields) {
    var private = results[0]["count(*)"] > 0;
    return callback(private);
  })
}

exports.topGames = function(id, since, selectFilter, callback) {
  var where = ""
  if(selectFilter == "noSoftware") where = "AND game NOT IN (SELECT game FROM knownGames WHERE type=2)"
  if(selectFilter == "noGames") where = "AND game NOT IN (SELECT game FROM knownGames WHERE type=1)"
  if(selectFilter == "gamesOnly") where = "AND game IN (SELECT game FROM knownGames WHERE type=1)"
  if(selectFilter == "softwareOnly") where = "AND game IN (SELECT game FROM knownGames WHERE type=2)"
  var qNoSince = `
  SELECT
    game,
      SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time
  FROM
      playtime
  WHERE
      userID = ?
      ${where}
  GROUP BY game
  ORDER BY time DESC`
  var qCustomSince = `
  SELECT
    game,
      SUM(TIMESTAMPDIFF(SECOND,startDate, IFNULL(endDate, NOW()))) AS time
  FROM
      playtime
  WHERE
      userID = ?
      AND startDate > ?
      ${where}
  GROUP BY game
  ORDER BY time DESC`
  if(since) {
    since = new Date(since)
    q = qCustomSince
  } else {
    q = qNoSince
  }
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

exports.topGamesDb = function(sinceDays, callback) {
  connection.query("SELECT game, players, iconURL, hours FROM topGames WHERE since=?", [sinceDays], function(error, results, fields) {
    callback(results);
  })
}

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