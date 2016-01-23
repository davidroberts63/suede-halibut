'use strict';

var express = require("express");
var app = express();

app.post('/pr-build-completion', function(req, res) {
    res.json({"complete":"yep"});
});

module.exports = app;