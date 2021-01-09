const supertest = require("supertest");
const {beforeEach, afterEach, describe, it} = require("@jest/globals");

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

describe('POST /rooms/add', function() { // TODO: mock db? Nu wordt alles gewoon in de database opgeslagen
    it('responds with json', function(done) {
        supertest(server)
            .post('/rooms/add')
            .send({
                levelName: 'test',
                roomId: 'LCtest',
                roomName: 'LC.test',
                peopleAmount: 10
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });
});