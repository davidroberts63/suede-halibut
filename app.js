var request = require("request");
var poster = require("./postissue");

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

function buildParameters(req, res, next) {
	var project = req.body.payload.reponame;
	var build = req.body.payload.build_num;
	var pull = req.body.payload.pull_request_urls[0];
	pull = pull.substring(pull.lastIndexOf("/") + 1);

	var url = "https://circleci.com/api/v1/project/" + settings.circleCiAccount + "/" + project + "/" + build + "/artifacts?circle-token=" + settings.circleCiToken;

	req.artifactsUrl = url;
	req.pullrequestNumber = pull;
	req.project = project;

	console.log("Build %s of pull request %s in the %s project", build, pull, project);
	console.log("Artifacts URL: %s", url.split("?").splice(0,1));

	next();
}

function artifactImages(req, res, next) {
	request({url: req.artifactsUrl, headers: { "Accept": "application/json"} }, function(err, response, body) {
		console.log("Retrieved the artifacts payload");
		var payload = JSON.parse(body);
		var screenshots = payload.map(theUrl).filter(forImages);
		console.log(screenshots);

		next();
	});
}

function postToPullRequest(req, res, next) {
	settings.prNumber = req.pullrequestNumber;
	settings.repoName = req.project;
	console.log("Posting for PR # %s of %s", settings.prNumber, settings.repoName);

	poster.postImagesToIssue(settings, screenshots, function() {
		res.type("json");
		res.json({completum: "yep"});
	});

	next();
}

function respondWithMaybe(req, res) {
	res.json({completum: "maybe"});
}

router.post("/pr-build-completion",
	bodyParser.json(),
	buildParameters,
	artifactImages,
	respondWithMaybe);

app.use("/", router);

var port = process.env["PORT"] || 8080;

console.log("Preparing to listen on port %d", port);
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
