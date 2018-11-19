var express = require('express')
  , router = express.Router()
  , bodyParser = require('body-parser')

var mysql = require('mysql')
var keys = require('../keys');
var connection = mysql.createConnection({
  host     : keys.mysqlhost,
  user     : keys.mysqluser,
  password : keys.mysqlpasswd,
  database : 'timeplayed',
  supportBigNumbers: true,
  charset: "utf8mb4"
});

connection.connect();

router.use(bodyParser.urlencoded({extended: true}));

function secondsToTime(str) {
  function sinceDate(since) {
    if(since instanceof Date) return since;
    if(!isNaN(since)) {
      var d = new Date();
      d.setMinutes(d.getMinutes() - since);
      return d;
    }

    var d = new Date();
    if(since == "all" || since == "always" || since == "total" || typeof since != "string") {
      return new Date("January 01, 1970 00:00:00");
    }
    if(["m", "h", "d", "w"].includes(since)) {
      since = "1" + since;
    }
    if(since == "today" || since == "day") {
      d.setHours(6);
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0)
      return d;
    }
    if(since == "week") {
      d.setDate(d.getDate() - 7);
      return d;
    }
    if(since == "month") {
      d.setDate(d.getDate() - 30);
      return d;
    }
    if(since == "hour") {
      d.setDate(d.getHours() - 1)
      return d;
    }
    var num = Number(since.substring(0, since.length - 1))
    if(since.endsWith("m")) {
      d.setMinutes(d.getMinutes() - num);
    }
    if(since.endsWith("h")) {
      d.setHours(d.getHours() - num);
    }
    if(since.endsWith("d")) {
      d.setDate(d.getDate() - num);
    }
    if(since.endsWith("w")) {
      d.setDate(d.getDate() - num * 7);
    }
    return d;
  }
  var now = new Date();
  var diffMS = Math.abs(now.getTime() - sinceDate(str))
  return Math.floor(diffMS / 1000);
}

router.post(/\/set-?config/, (req, res) => {
  var toChange = req.body;
  var guildID = toChange.guildID;

  if(!req.session.userGuilds.map(e => {return e.id}).includes(guildID)) {
    return res.send("")
  }

  var validConfigNames = [
		"prefix",
		"rankingChannel",
		"defaultGame",
		"roleAwards",
		"leaderboardLayout",
		"leaderboardNoMoreToday",
		"leaderboardNoMoreWeek",
		"leaderboardNoMoreAlways",
		"leaderboardNoToday",
		"leaderboardNoWeek",
		"leaderboardNoAlways"
  ];

  if(Object.keys(toChange).includes("awards")) {
    var valuesStr = "";
    var escapeArr = [];
    var firstDone = false;
    var regex = /^[0-9]{1,2}[mhdw]$|^minute$|^hour$|^day$|^week$/;
    toChange.awards.forEach(award => {
      if(regex.test(award.time) && regex.test(award.per) && award.roleID && award.game) {
        if(!firstDone) {
          valuesStr += "(?, ?, ?, ?, ?)";
          firstDone = true;
        } else {
          valuesStr += ",(?, ?, ?, ?, ?)";
        }
        escapeArr.push(guildID, award.roleID, award.game, secondsToTime(award.time), secondsToTime(award.per));
      }
    })
    connection.query(`DELETE FROM roleAwards WHERE guildID=?`, [guildID], function(error, results, fields) {
      if(toChange.awards.length > 0 && toChange.awards[0] != "remove") {
        connection.query(`INSERT INTO roleAwards (guildID, roleID, game, time, per) VALUES ${valuesStr}`, escapeArr, function(error, results, fields) {
          res.send('')
        })
      } else {
        res.send('')
      }
    })
  } else if(Object.keys(toChange).some(e => {return validConfigNames.includes(e)})) {
    var sets = "";
    var escapeArr = [];
    var firstDone = false;
    Object.keys(toChange).forEach(key => {
      if(validConfigNames.includes(key)) {
        var value = toChange[key];
        var comma = ",";
        if(!firstDone) {
          comma = "";
          firstDone = true;
        }
        sets += `${comma}${key}=?`
        escapeArr.push(value);
      }
    })
    escapeArr.push(guildID)
    var queryString = `UPDATE guildSettings SET ${sets} WHERE guildID=?`;
    connection.query(queryString, escapeArr, function(error, results, fields) {
      res.send('')
    })
  }
});

module.exports = router;