var GithubApi = require("github");

module.exports.postImagesToIssue = function(settings, cdnUrls, callback) {
	var github = new GithubApi({
		version: "3.0.0",
		protocol: "https",
		host: "api.github.com",
		timeout: 5000
	});

	github.authenticate({
		type: "basic",
		username: settings.githubUsername,
		password: settings.githubApiKey
	});

	var comment = "";
	for(var image of cdnUrls) {
		comment += image.name + "\r\n" + "![" + image.name + " screenshot](" + image.url + ")\r\n";
	}

	console.log("Issue comment:");
	console.log(comment);

	github.issues.createComment({
		user: settings.orgName,
		repo: settings.repoName,
		number: settings.prNumber,
		body: comment
	}, function(err, res) {
		console.log(err);
		console.log("==================");
		console.log(res);
	});

	callback(null);
}
