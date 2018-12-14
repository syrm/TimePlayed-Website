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

var Profile = require('./models/profile')

function updateTopGamesOld() {
  var d = new Date();
  d.setDate(d.getDate() - 7);
  Profile.topGames(undefined, d, function(topGames) {
    connection.query("DELETE FROM topGames", function(error, results, fields) {
      var arr = [];
      topGames.forEach((game, i) => {
        arr.push([i + 1, game.game, game.time, game.iconURL])
      })
      connection.query("INSERT INTO topGames (place, game, time, iconURL) VALUES ?", [arr], function(error, results, fields) {
        console.log("Top games updated")
      })
    })
  }, 10)
}

function updateTopGames(since) {
  connection.query("SELECT DISTINCT game FROM playtime", function(error, results, fields) {
    var gameArr = results.map(e => e.game)
    var q = "SELECT "
    var escapes = [];
    var d = new Date();
    d.setDate(d.getDate() - since);
    gameArr.forEach((game, i) => {
      var comma = ","
      if(i == gameArr.length - 1) comma = "";
      q += `(select COUNT(DISTINCT userID) FROM timeplayed.playtime WHERE game=? AND endDate > ?) as ?${comma}`
      escapes.push(game, d, game)
    })
    connection.query(q, escapes, function(error, results, fields) {
      var topGames = [];
      for (var game in results[0]) {
        topGames.push({game: game, players: results[0][game]})
      }
      topGames.sort((a, b) => b.players - a.players);
      topGames.splice(10);

      connection.query("SELECT game, iconURL FROM gameIcons WHERE game IN (?)", [topGames.map(e => e.game)], function(error, results, fields) {
        topGames.forEach((game, i) => {
          var iconResult = results.filter(e => {return e.game == game.game})
          if(iconResult[0] && iconResult[0].iconURL) topGames[i].iconURL = iconResult[0].iconURL
        })
        connection.query("DELETE FROM topGames WHERE since=?", [since], function(error, results, fields) {
          var arr = [];
          topGames.forEach((game, i) => {
            arr.push([game.game, game.players, game.iconURL, since])
          })
          connection.query("INSERT INTO topGames (game, players, iconURL, since) VALUES ?", [arr], function(error, results, fields) {
            console.log("Top games updated")
          })
        })
      })
    })
  })
}

updateTopGames(1);
setInterval(updateTopGames, 600000, 1);
updateTopGames(7);
setInterval(updateTopGames, 600000, 7);