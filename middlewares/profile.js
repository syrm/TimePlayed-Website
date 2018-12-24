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

var Discord = require("../models/discord")

router.use(bodyParser.urlencoded({extended: true}));

router.post("/set-privacy", (req, res) => {
    if(!req.session.userInfo) return res.send("")
    var private = req.body.private
    if(private == 'true') {
        q = "INSERT IGNORE INTO privateUsers (userID) VALUES (?)"
    } else {
        q = "DELETE FROM privateUsers WHERE userID=?"
    }
    connection.query(q, [req.session.userInfo.id], function(error, results, fields) {
        res.send("")
    })
})

router.post("/set-guild-privacy", (req, res) => {
    var guildID = req.body.id
    var value = Number(req.body.value)
    var userGuilds = req.session.userGuilds
    // Return if no manage server permission
    if(!userGuilds || !userGuilds.filter(e => e.id == guildID)[0] || !Discord.permList(userGuilds.filter(e => e.id == guildID)[0].permissions).includes("generalManageServer")) return res.send("");
    // Return if invalid value or no guild ID
    if(!guildID || value > 2) return res.send("");
    // Execute query
    connection.query("INSERT INTO guildPrivacy (guildID, value) VALUES(?, ?) ON DUPLICATE KEY UPDATE value=?", [guildID, req.body.value, req.body.value], function(error, results, fields) {
        res.send("")
    })
})

module.exports = router;