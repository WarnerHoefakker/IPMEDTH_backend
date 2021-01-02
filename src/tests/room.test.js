const supertest = require("supertest");
const {beforeEach, afterEach} = require("@jest/globals");

let server = null;

beforeEach(() => {
    server = require('../index');
});

afterEach(() => {
    if (server) {
        server.close();
    }
});

test("Test endpoints", async () => {
    const { body } = await supertest(server)
        .get('/rooms')
        .expect('Content-Type', /json/)
        .expect(200)
});