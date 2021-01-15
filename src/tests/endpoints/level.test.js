const supertest = require("supertest");
const {beforeAll, afterAll, describe, it} = require("@jest/globals");
const Room = require("../../models/room");
const Level = require("../../models/level");

let server = null;

beforeAll(async () => {
    server = require('../../index');

    const testLevel = new Level({levelName: 'testLevel'});
    await testLevel.save();
    const testRoom = new Room({levelId: testLevel._id, roomId: "levelTestRoom", roomName: "levelTestRoom", peopleAmount: 10})
    await testRoom.save();
});

afterAll(() => {
    removeDbEntries().then(() => {
        if (server) {
            server.close();
        }
    })
});

const removeDbEntries = async () => {
    await Room.deleteMany({});
    await Level.deleteMany({levelName: 'testLevel'});
};

describe('GET /levels/:levelName/status', function() {
    it('Should return the safetylevel for each room', function(done) {
        supertest(server)
            .get('/levels/testLevel/status')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                //
                expect(res.body).toHaveProperty('levelTestRoom', 'green');

                done();
            });
    });

    it('Should return a 404 error (level doesn\'t exist', function(done) {
        supertest(server)
            .get('/levels/testLevelBestaatNiet/status')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                //
                expect(res.body).toHaveProperty('error');

                done();
            });
    });
});