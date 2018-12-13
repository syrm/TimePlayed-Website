const express = require('express')
var cookieParser = require('cookie-parser');
var session = require('express-session');
const app = express()
const port = 80

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(session({secret: "SFJSDF4cvn4DSAFSF456f654xcv132Fsxc34dsFxcsfd"}));

app.use(express.static(__dirname + '/public'))
app.use(require('./controllers'))
app.use('/', require('./middlewares/discord'));
app.use('/', require('./middlewares/set-config'));

app.use(function(req, res, next) {
  res.render("404", {
    userInfo: req.session.userInfo
  });
});

app.listen(port, () => console.log(`Listening on port ${port}!`))