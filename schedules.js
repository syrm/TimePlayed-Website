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

function updateTopGames() {
  var d = new Date();
  d.setDate(d.getDate() - 7);
  Profile.topGames(undefined, d, function(topGames) {
    connection.query("DELETE FROM topGamesWeek", function(error, results, fields) {
      var arr = [];
      topGames.forEach((game, i) => {
        arr.push([i + 1, game.game, game.time, game.iconURL])
      })
      connection.query("INSERT INTO topGamesWeek (place, game, time, iconURL) VALUES ?", [arr], function(error, results, fields) {
        console.log("Top games updated")
      })
    })
  })
}
updateTopGames();
setInterval(updateTopGames, 600000)