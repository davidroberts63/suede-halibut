var request = require("request");
var poster = require("./postissue");

var util = require("util");
var bodyParser = require("body-parser");
var express = require("express");
var app = express();
var router = express.Router();

console.log("Getting settings");
var settings = {};
settings.circleCiAccount = process.env["CIRCLE_CI_ACCOUNT"];
settings.circleCiToken = process.env["CIRCLE_CI_TOKEN"];
settings.githubUsername = process.env["GITHUB_USERNAME"];
settings.githubApiKey = process.env["GITHUB_APIKEY"];
settings.orgName = process.env["GITHUB_ORGNAME"];

router.use(function(req, res, next) {
	console.log("Incoming: %s %s", req.method, req.url);
	next();
});
router.get("/", function(req, res) {
	res.send("Ready when you are");
});

router.post("/pr-build-completion", bodyParser.json(), function(req, res) {
	console.log("POST build completion");
	var username = req.body.payload.username;
	var project = req.body.payload.reponame;
	var build = req.body.payload.build_num;
	var pull = req.body.payload.pull_request_urls[0];
	pull = pull.substring(pull.lastIndexOf("/") + 1);
	console.log("--for build %s of pull %s in the %s project for %s", build, pull, project, username);

	var url = "https://circleci.com/api/v1/project/" + username + "/" + project + "/" + build + "/artifacts";
	console.log("Requesting artifacts from %s", url);
	url = url + "?circle-token=" + settings.circleCiToken;

	request({url: url, headers: { "Accept": "application/json"} }, function(err, response, body) {
		console.log("Retrieved the artifacts payload");
		console.log("Payload: " + body);

		var payload = JSON.parse(body);
		var screenshots = payload.map(theUrl).filter(forImages);
		console.log(screenshots);

		console.log("Posting to Github PR");
		settings.prNumber = pull;
		settings.repoName = project;

		poster.postImagesToIssue(settings, screenshots, function() {
			res.type("json");
			res.json({completum: "yep"});
		});
	});
});

app.use("/", router);

var port = process.env["PORT"] || 8080;

console.log("Preparing to listen on %d", port);
var server = app.listen(port, function() {
	console.log('%s: Node server started on port %d ...',
							Date(Date.now() ), port);
});

function theUrl(artifact) {
	return { url: artifact.url,
		name: artifact.url.substring(artifact.url.lastIndexOf("/") + 1, artifact.url.lastIndexOf("-"))
	};
}

function forImages(image) {
	return image.url.substring(image.url.length - 3) == "png";
}
