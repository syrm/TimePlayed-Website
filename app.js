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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))