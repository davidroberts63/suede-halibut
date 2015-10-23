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

router.get("/pr-build-completion/:project/:pull/:build", function(req, res) {
	console.log("Build completion: %s pr# %s build# %s", req.params.project, req.params.pull, req.params.build);

	console.log("Requesting build artifacts payload");
	var url = "https://circleci.com/api/v1/project/" + settings.circleCiAccount + "/" + req.params.project + "/" + req.params.build + "/artifacts?circle-token=" + settings.circleCiToken;

	request({url: url, headers: { "Accept": "application/json"} }, function(err, response, body) {
		console.log("Retrieved the artifacts payload");
		var payload = JSON.parse(body);
		var screenshots = payload.map(theUrl).filter(forImages);
		console.log(screenshots);

		console.log("Posting to Github PR");
		settings.prNumber = req.params.pull;
		settings.repoName = req.params.project;

		poster.postImagesToIssue(settings, screenshots, function() {
			res.type("json");
			res.json({completum: "yep"});
		});
	});
});

router.post("/pr-build-completion", bodyParser.json(), function(req, res) {
	console.log("POST build completion");
	var project = req.body.reponame;
	var build = req.body.build_num;
	var pull = req.body.pull_request_urls[0];
	pull = pull.substring(pull.lastIndexOf("/") + 1);
	console.log("--for build %s of pull %s in the %s project", build, pull, project);

	var url = "https://circleci.com/api/v1/project/" + settings.circleCiAccount + "/" + project + "/" + build + "/artifacts?circle-token=" + settings.circleCiToken;

	// DRY you say? Yeah I know SOLID. Right now just learning nodejs, so it's https://www.youtube.com/watch?v=s8MDNFaGfT4
	request({url: url, headers: { "Accept": "application/json"} }, function(err, response, body) {
		console.log("Retrieved the artifacts payload");
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

var port = process.env.OPENSHIFT_NODEJS_PORT || process.env["PORT"] || 8080;
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

console.log("Preparing to listen on %s:%d", ipaddress, port);
var server = app.listen(port, function() {
	console.log('%s: Node server started on %s:%d ...',
							Date(Date.now() ), ipaddress, port);
});

// BWAHAHAHA GLOBAL!!! Whatever, you see how small this file is?
function theUrl(artifact) {
	return { url: artifact.url,
		name: artifact.url.substring(artifact.url.lastIndexOf("/") + 1, artifact.url.lastIndexOf("-"))
	};
}

function forImages(image) {
	return image.url.substring(image.url.length - 3) == "png";
}
