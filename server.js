/**
 * Created by karkkmik on 9.11.2014.
 */
var connect = require('connect');
var serveStatic = require('serve-static');

var app = connect();

var port = process.env.PORT || 1337;

app.use(serveStatic('www'));
app.use(serveStatic('bower_components'));

var http = require('http').Server(app);

http.listen(port);