const express = require('express')
var cookieParser = require('cookie-parser');
var session = require('express-session');
var favicon = require('serve-favicon');
const app = express()
const port = 80

// Start top games schedule
require('./schedules');

var botClient = require("./middlewares/botClient")

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(session({secret: "SFJSDF4cvn4DSAFSF456f654xcv132Fsxc34dsFxcsfd"}));

console.log("Starting bot up...")
botClient.startClient(function(client) {
  app.use(favicon(__dirname + '/public/images/favicon.ico'));

  app.use(express.static(__dirname + '/public'))
  app.use(require('./controllers'))
  app.use('/', require('./middlewares/discord'));
  app.use('/', require('./middlewares/profile'));

  app.use(function(req, res, next) {
    res.render("404", {
      userInfo: req.session.userInfo
    });
  });
  app.listen(port, () => console.log(`Listening on port ${port}!`))
})