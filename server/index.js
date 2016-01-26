var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var request = require("request");

app.post('/pr-build-completion', bodyParser.json(), function(req, res) {
    res.json({completum:"yes"});
});

module.exports = app;