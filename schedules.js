var mysql = require('mysql')
var keys = require('./keys');
var connection = mysql.createPool({
  connectionLimit : 20,
  host     : keys.mysqlhost,
  user     : keys.mysqluser,
  password : keys.mysqlpasswd,
  database : 'timeplayed',
  supportBigNumbers: true
});

function updateTopGames(since, callback) {
  console.log("Selecting all games...")
  connection.query("SELECT game FROM knownGames;", function(error, results, fields) {
    if(!results) return;
    var gameArr = results.map(e => e.game)
    var q = "SELECT "
    var escapes = [];
    gameArr.forEach((game, i) => {
      var comma = ","
      if(i == gameArr.length - 1) comma = "";
      q += `(SELECT COUNT(DISTINCT userID) FROM playtime WHERE game=? AND endDate > NOW() - INTERVAL ? DAY) as ?,`
      escapes.push(game, since, game + "_count")
      q += `(SELECT SUM(TIMESTAMPDIFF(SECOND, startDate, endDate)) / 3600 FROM playtime WHERE game=? AND endDate > NOW() - INTERVAL ? DAY) as ?${comma}`
      escapes.push(game, since, game + "_time")
    })
    console.log("Calculating playtime...")
    connection.query(q, escapes, function(error, results, fields) {
      if(!results) return callback();
      var topGames = [];
      for (var game in results[0]) {
        if(game.endsWith("_count")) {
          var realName = game.replace("_count", "");
          topGames.push({game: realName, players: results[0][game], time: results[0][realName + "_time"]})
        }
      }
      topGames.sort((a, b) => b.players - a.players);
      topGames.splice(6);
      console.log("Retrieving icons...")
      connection.query("SELECT game, iconURL FROM knownGames WHERE game IN (?)", [topGames.map(e => e.game)], function(error, results, fields) {
        topGames.forEach((game, i) => {
          var iconResult = results.filter(e => {return e.game == game.game})
          if(iconResult[0] && iconResult[0].iconURL) topGames[i].iconURL = iconResult[0].iconURL
        })
        console.log("Inserting in database...")
        connection.query("DELETE FROM topGames WHERE since=?", [since], function(error, results, fields) {
          var arr = [];
          topGames.forEach((game, i) => {
            arr.push([game.game, game.players, game.time, game.iconURL, since])
          })
          connection.query("INSERT INTO topGames (game, players, hours, iconURL, since) VALUES ?", [arr], function(error, results, fields) {
            if(callback) callback();
          })
        })
      })
    })
  })
}

function updateGames() {
  updateTopGames(7, function() {
    updateTopGames(30, function() {
      console.log("Top games updated!")
      setTimeout(updateGames, 600000)
    })
  })
}
if(keys.schedule) {
  updateGames();
}