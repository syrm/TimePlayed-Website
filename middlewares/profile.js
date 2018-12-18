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

module.exports = router;