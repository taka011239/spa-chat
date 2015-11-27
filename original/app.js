'use strict';

var http = require('http');
var express = require('express');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static');
var morgan = require('morgan');
var errorhandler = require('errorhandler');
var routes = require('./lib/routes');

var env = process.env.NODE_ENV;
var app = express();
var server = http.createServer(app);

if ('development' === env) {
  app.use(morgan('combined'));
  app.use(errorhandler());
}

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(serveStatic(__dirname + '/public'));

routes.configRoutes(app, server);

server.listen(3000);
