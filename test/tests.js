'use strict'
var request = require("request");
var githubApi = require("github");
var expect = require("chai").use(require("sinon-chai")).expect;
var supert = require("supertest");
var sinon = require("sinon");
var app = require("../server");

describe("Valid requests to pr-build-completion", function() {
    var payload = { payload: {
        username: "arthurdent",
        reponame: "earth",
        build_num: 2,
        pull_request_urls: ["/1",""]
    }};
    var response = null;
    var github = null;
    var comment = null;
    
    it("gets circleci build artifact data", function(done) {    
        var urlForArtifacts = sinon.match.has("url", "https://circleci.com/api/v1/project/arthurdent/earth/2/artifacts?circle-token=zzcircletokenzz");
        
        expect(request.Request).calledWith(urlForArtifacts);
        done();
    });

    it("accepts only json for circleci build artifact response", function(done) {
        expect(request.Request).calledWith(sinon.match.has("headers", { "Accept": "application/json"}));
        done();    
    });
    
    it("posts to github issue", function(done) {
        expect(github.issues.createComment).calledWith(sinon.match({
            user: "arthurdent",
            repo: "earth",
            number: 1
        }));
        done();
    });
    
    it("posts markdown comment to github issue", function(done) {
        expect(github.issues.createComment).calledWith(sinon.match({
            body: comment
        }));
        done();
    });
    
    it("returns completum body in response", function(done) {
        expect(response).to.have.property("completum", "yes");
        done(); 
    });
    
    beforeEach(function(done) {
        stubArtifactResponse();
        stubGithubResponses();
        
        supert(app)
            .post("/pr-build-completion")
            .send(payload)
            .set("Content-Type", "application/json")
            .expect(200)
            .end(function(err, result) {
                response = result;
                done();
            })
    });
    
    function stubGithubResponses() {
        github = new githubApi({
            version: "3.0.0",
            protocol: "https",
            host: "api.github.com",
            timeout: 5000
        });
        
        sinon.stub(github, "authenticate");
        sinon.stub(github.issues, "createComment", function(params, cb) { 
            cb(null, "");
        });
    }
    
    function stubArtifactResponse() {
        var artifactResult = [
            {url: "http://example.com/long-path/home-5x5.png"},
            {url: "http://example.com/long-path/post-3x3.png"},
            {url: "http://example.com/long-path/some_app_out.txt"},
        ]

        comment = "home\r\n![home screenshot](http://example.com/long-path/home-5x5.png)\r\npost\r\n![post screenshot](http://example.com/long-path/post-3x3.png)";
        
        sinon.stub(request, "Request", function(params) {
           params.callback(null, null, JSON.stringify(artifactResult));
        });        
    }
    
    afterEach(function(done) {
        request.Request.restore();
        github.issues.createComment.restore();
        response = null;
        done();
    });
    
    
});
