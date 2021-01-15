const supertest = require("supertest");
const {beforeAll, afterAll, describe, it} = require("@jest/globals");
const Room = require("../../models/room");
const Level = require("../../models/level");
const Co2 = require("../../models/co2");

let server = null;

beforeAll(async () => {
    server = require('../../index');

    const testLevel = new Level({levelName: 'co2TestLevel'});
    await testLevel.save();
    const testRoom = new Room({levelId: testLevel._id, roomId: "co2TestRoom", roomName: "co2TestRoom", peopleAmount: 10})
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
    await Co2.deleteMany({});
    await Level.deleteMany({levelName: 'co2TestLevel'});
}

describe('POST /co2add', function() {
    it('Should add a new co2 value', function(done) {
        supertest(server)
            .post('/co2add')
            .send({
                value: '700',
                roomId: 'co2TestRoom'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body.value).toBe(700);

                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('roomId');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');

                done();
            });
    });

    it('Should not add a new co2 value if room doesn\'t exist', function(done) {
        supertest(server)
            .post('/co2add')
            .send({
                value: '700',
                roomId: 'co2TestRoomBestaatNiet'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });

    it('Should not add a new co2 value if roomId is missing', function(done) {
        supertest(server)
            .post('/co2add')
            .send({
                value: '700',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });

    it('Should not add a new co2 value if value is missing', function(done) {
        supertest(server)
            .post('/co2add')
            .send({
                roomId: 'co2TestRoom'
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });
});