const supertest = require("supertest");
const {beforeAll, afterAll, describe, it} = require("@jest/globals");
const Room = require("../../models/room");

let server = null;

beforeAll(() => {
    server = require('../../index');
});

afterAll(() => {
    Room.deleteMany({}).then(() => {
        if (server) {
            server.close();
        }
    })
});

describe('POST /rooms/add', function() {
    it('Should add a room', function(done) {
        supertest(server)
            .post('/rooms/add')
            .send({
                levelName: 'LC5',
                roomId: 'LC5001',
                roomName: 'LC5.001',
                peopleAmount: 10
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body.roomId).toBe('LC5001');
                expect(res.body.roomName).toBe('LC5.001');
                expect(res.body.peopleAmount).toBe(10);

                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');
                expect(res.body).toHaveProperty('levelId');

                done();
            });
    });

    it('Should not add duplicated room', function(done) {
        supertest(server)
            .post('/rooms/add')
            .send({
                levelName: 'LC5',
                roomId: 'LC5001',
                roomName: 'LC5.001',
                peopleAmount: 10
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });

    it('Should not add a room if the roomId is missing', function(done) {
        supertest(server)
            .post('/rooms/add')
            .send({
                levelName: 'LC5',
                roomName: 'LC5.003',
                peopleAmount: 10
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });

    it('Should not add a room if the roomName is missing', function(done) {
        supertest(server)
            .post('/rooms/add')
            .send({
                levelName: 'LC5',
                roomId: 'LC5003',
                peopleAmount: 10
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });

    it('Should not add a room if the levelName is missing', function(done) {
        supertest(server)
            .post('/rooms/add')
            .send({
                roomId: 'LC5003',
                roomName: 'LC5.003',
                peopleAmount: 10
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });

    it('Should not add a room if the max. amount of people is missing', function(done) {
        supertest(server)
            .post('/rooms/add')
            .send({
                levelName: 'LC5',
                roomId: 'LC5003',
                roomName: 'LC5.003'
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

describe('GET /rooms', function() {
    it('Should return one room', function(done) {
        supertest(server)
            .get('/rooms')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body).toHaveLength(1);

                done();
            });
    });
})

describe('GET /:roomId/currentstatus', function() {
    it('Should return status \'green\'', function(done) {
        supertest(server)
            .get('/LC5001/currentstatus')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                expect(res.body.safetyLevel).toBe("green");
                expect(res.body).toHaveProperty('co2');
                expect(res.body).toHaveProperty('people');

                done();
            });
    });

    it('Should return a 404 error (room not found)', function(done) {
        supertest(server)
            .get('/LC5002/currentstatus')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);

                done();
            });
    });
})