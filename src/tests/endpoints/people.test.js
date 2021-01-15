const supertest = require("supertest");
const {beforeAll, afterAll, describe, it} = require("@jest/globals");
const Room = require("../../models/room");
const Level = require("../../models/level");
const People = require("../../models/people");
const Tag = require("../../models/rfid");

let server = null;

beforeAll(async () => {
    server = require('../../index');

    const testLevel = new Level({levelName: 'testLevel'});
    await testLevel.save();

    const testRoom = new Room({levelId: testLevel._id, roomId: "levelTestRoom", roomName: "levelTestRoom", peopleAmount: 10});
    await testRoom.save();

    const testTag = new Tag({tagId: 'testTag', appId: 'testAppId', firebaseToken: 'testFirebaseToken'});
    await testTag.save();

    const testTag2 = new Tag({tagId: 'testTag2', appId: 'testAppId2', firebaseToken: 'testFirebaseToken2'});
    await testTag2.save();

    const newLogin = new People({tagId: testTag._id, roomId: testRoom._id, roomName: testRoom.roomName, levelId: testLevel._id});
    await newLogin.save();
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
    await Tag.deleteMany({});
    await People.deleteMany({});
};

describe('GET /people/amount/:roomId', function() {
    it('Should return the amount of people', function(done) {
        supertest(server)
            .get('/people/amount/levelTestRoom')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('count', 1);

                done();
            });
    });

    it('Should return a 404 error (room doesn\'t exist', function(done) {
        supertest(server)
            .get('/people/amount/bestaatNiet')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });
});

describe('GET /people/currentlocation/:appId', function() {
    it('Should return the current location', function(done) {
        supertest(server)
            .get('/people/currentlocation/testAppId')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('loggedIn', true);
                expect(res.body).toHaveProperty('roomName', 'levelTestRoom');
                expect(res.body).toHaveProperty('roomId', 'levelTestRoom');
                expect(res.body).toHaveProperty('safetyLevel', 'green');
                expect(res.body).toHaveProperty('startTime');
                expect(res.body).toHaveProperty('totalTime');

                done();
            });
    });

    it('Should return that the user is not loggedIn', function(done) {
        supertest(server)
            .get('/people/currentlocation/testAppId2')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('loggedIn', false);

                done();
            });
    });

    it('Should return a 404 error (appId doesn\'t exist', function(done) {
        supertest(server)
            .get('/people/currentlocation/bestaatNiet')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });
});