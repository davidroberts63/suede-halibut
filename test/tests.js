var expect = require("chai").expect;
var request = require("supertest");
var app = require("../server");

describe("Requests to pr-build-completion", function() {
    it("returns 405 method not allowed upon GET request", function(done) {
        request(app)
            .get('/pr-build-completion')
            .expect(405, done);
    });
});
