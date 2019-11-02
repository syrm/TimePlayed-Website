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

function updateGames() {
  var q = `
  INSERT INTO topGames (game, players, hours, iconURL, since)
  SELECT
    playtime.game,
    COUNT(DISTINCT userID) AS count,
    SUM(TIMESTAMPDIFF(SECOND, startDate, endDate)) / 3600 AS time,
      knownGames.iconURL AS iconURL,
      ? AS since
  FROM playtime
  INNER JOIN knownGames ON playtime.game=knownGames.game
  WHERE
    startDate > NOW() - INTERVAL ? DAY
      AND knownGames.type != 2
  GROUP BY playtime.game
  ORDER BY count DESC
  LIMIT 6`
  connection.query("DELETE FROM topGames", function(error, results, fields) {
    connection.query(q, [7, 7, 7], function(error, results, fields) {
      connection.query(q, [30, 30, 30], function(error, results, fields) {
        console.log("Top games updated!")
        setTimeout(updateGames, 43200000)
      })
    })
  })
}

if(keys.schedule) {
  updateGames();
}