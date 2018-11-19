var mysql = require('mysql')
var keys = require('../keys');
var connection = mysql.createConnection({
  host     : keys.mysqlhost,
  user     : keys.mysqluser,
  password : keys.mysqlpasswd,
  database : 'timeplayed'
});

connection.connect();

exports.checkPrivate = function(userID, callback) {
  connection.query("SELECT count(*) FROM privateUsers WHERE userID=? ", [userID], function(error, results, fields) {
    var private = results[0]["count(*)"] > 0;
    return callback(private);
  })
}

exports.topGames = function(id, since, callback) {
  if(since) {
    since = new Date(since)
  } else {
    since = new Date("January 01, 1970 00:00:00")
  }
  connection.query(`SELECT * FROM playtime WHERE userID=?`, [id], function(error, results, fields) {
    var games = [];
    results.forEach(function(result, i) {
      if(!result.endDate) {
        if(i != results.length - 1) {
          return;
        } else {
          result.endDate = new Date()
        }
      }
      var diffMS = 0;
      if(result.endDate > since) {
        if(result.startDate < since) {
          diffMS = Math.abs(result.endDate.getTime() - since.getTime())
        }
        if(result.startDate > since) {
          diffMS = Math.abs(result.endDate.getTime() - result.startDate.getTime());
        }
      }
      if(diffMS < 1) return;
      if(games.some(e => e.game == result.game)) {
          var index = games.map(e => {return e.game}).indexOf(result.game);
          games[index].time += Math.floor(diffMS / 1000);
      } else {
          games.push({game: result.game, time: Math.floor(diffMS / 1000)})
      }
    })
    games.sort(function(a, b){return b.time-a.time});
    connection.query("SELECT game, iconURL FROM gameIcons WHERE game IN (?)", [games.map(e => {return e.game})], function(error, results, fields) {
      games.forEach((game, i) => {
        var iconResult = results.filter(e => {return e.game == game.game})
        if(iconResult[0] && iconResult[0].iconURL) games[i].iconURL = iconResult[0].iconURL
      })
      return callback(games)
    })
  })
}
