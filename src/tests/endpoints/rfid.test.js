const supertest = require("supertest");
const {beforeAll, afterAll, describe, it} = require("@jest/globals");
const Room = require("../../models/room");
const Level = require("../../models/level");
const People = require("../../models/people");
const Tag = require("../../models/rfid");

let server = null;

beforeAll(async () => {
    server = require('../../index');

    const testLevel = new Level({levelName: 'testLevelRfid'});
    await testLevel.save();

    const testRoom = new Room({
        levelId: testLevel._id,
        roomId: "rfidTestRoom",
        roomName: "rfidTestRoom",
        peopleAmount: 10
    });
    await testRoom.save();

    const testRoom2 = new Room({
        levelId: testLevel._id,
        roomId: "rfidTestRoom2",
        roomName: "rfidTestRoom2",
        peopleAmount: 10
    });
    await testRoom2.save();

    const testTagLogin = new Tag({
        tagId: 'testTagLogin',
        appId: 'testAppIdLogin',
        firebaseToken: 'testFirebaseTokenLogin'
    });
    await testTagLogin.save();

    const testTagLogout = new Tag({
        tagId: 'testTagLogout',
        appId: 'testAppIdLogout',
        firebaseToken: 'testFirebaseTokenLogout'
    });
    await testTagLogout.save();

    const newLogin = new People({
        tagId: testTagLogout._id,
        roomId: testRoom._id,
        roomName: testRoom.roomName,
        levelId: testLevel._id
    });
    await newLogin.save();

    const testTagLogdedIn = new Tag({
        tagId: 'testTagLoggedIn',
        appId: 'testAppIdLoggedIn',
        firebaseToken: 'testFirebaseTokenLoggedIn'
    });
    await testTagLogdedIn.save();

    const newPeopleLoggedIn = new People({
        tagId: testTagLogdedIn._id,
        roomId: testRoom._id,
        roomName: testRoom.roomName,
        levelId: testLevel._id
    });
    await newPeopleLoggedIn.save();

    // const testTag2 = new Tag({tagId: 'testTag2', appId: 'testAppId2', firebaseToken: 'testFirebaseToken2'});
    // await testTag2.save();
    //
    // const newLogin = new People({tagId: testTag._id, roomId: testRoom._id, roomName: testRoom.roomName, levelId: testLevel._id});
    // await newLogin.save();
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
    await Level.deleteMany({levelName: 'testLevelRfid'});
    await Tag.deleteMany({});
    await People.deleteMany({});
};

describe('POST /rfid/add', function () {
    it('Should add a new tag', function (done) {
        supertest(server)
            .post('/rfid/add')
            .send({
                tagId: 'testRfidTagId',
                appId: 'testRfidAppId',
                firebaseToken: 'testRfidFirebaseToken',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body.tagId).toBe('testRfidTagId');
                expect(res.body.appId).toBe('testRfidAppId');
                expect(res.body.firebaseToken).toBe("testRfidFirebaseToken");
                //
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');

                done();
            });
    });

    it('Should overwrite a tag with an existing tagId', function (done) {
        supertest(server)
            .post('/rfid/add')
            .send({
                tagId: 'testRfidTagId',
                appId: 'testRfidAppId2',
                firebaseToken: 'testRfidFirebaseToken2',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body.tagId).toBe('testRfidTagId');
                expect(res.body.appId).toBe('testRfidAppId2');
                expect(res.body.firebaseToken).toBe("testRfidFirebaseToken2");
                //
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');

                done();
            });
    });

    it('Should overwrite a tag with an existing appId', function (done) {
        supertest(server)
            .post('/rfid/add')
            .send({
                tagId: 'testRfidTagId3',
                appId: 'testRfidAppId',
                firebaseToken: 'testRfidFirebaseToken3',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body.tagId).toBe('testRfidTagId3');
                expect(res.body.appId).toBe('testRfidAppId');
                expect(res.body.firebaseToken).toBe("testRfidFirebaseToken3");
                //
                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');

                done();
            });
    });

    it('Should not add a tag if the tagId is missing', function (done) {
        supertest(server)
            .post('/rfid/add')
            .send({
                appId: 'testRfidAppId5',
                firebaseToken: 'testRfidFirebaseToken5',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function (err, res) {
                if (err) return done(err);

                done();
            });
    });
    it('Should not add a tag if the appId is missing', function (done) {
        supertest(server)
            .post('/rfid/add')
            .send({
                tagId: 'testRfidTagId5',
                firebaseToken: 'testRfidFirebaseToken5',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function (err, res) {
                if (err) return done(err);

                done();
            });
    });

    it('Should not add a tag if the firebaseToken is missing', function (done) {
        supertest(server)
            .post('/rfid/add')
            .send({
                tagId: 'testRfidTagId5',
                appId: 'testRfidAppId5',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function (err, res) {
                if (err) return done(err);

                done();
            });
    });
});

describe('POST /rfid/login', function () {
    it('Should login', function (done) {
        supertest(server)
            .post('/rfid/login')
            .send({
                value: 'testTagLogin',
                roomid: 'rfidTestRoom',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body.roomName).toBe('rfidTestRoom');

                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('tagId');
                expect(res.body).toHaveProperty('roomId');
                expect(res.body).toHaveProperty('levelId');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');

                done();
            });
    });

    it('Should overwrite an existing login', function (done) {
        supertest(server)
            .post('/rfid/login')
            .send({
                value: 'testTagLogin',
                roomid: 'rfidTestRoom2',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body.roomName).toBe('rfidTestRoom2');

                expect(res.body).toHaveProperty('_id');
                expect(res.body).toHaveProperty('tagId');
                expect(res.body).toHaveProperty('roomId');
                expect(res.body).toHaveProperty('levelId');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');

                done();
            });
    });

    it('Should not login if the room does not exist', function (done) {
        supertest(server)
            .post('/rfid/login')
            .send({
                value: 'testTagLogin',
                roomid: 'rfidTestRoomBestaatNiet',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });

    it('Should not login if the tagId does not exist', function (done) {
        supertest(server)
            .post('/rfid/login')
            .send({
                value: 'testTagLoginBestaatNiet',
                roomid: 'rfidTestRoom',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });

    it('Should return not login if the roomId is missing', function (done) {
        supertest(server)
            .post('/rfid/login')
            .send({
                value: 'testTagLogin',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });

    it('Should return not login if the tagId is missing', function (done) {
        supertest(server)
            .post('/rfid/login')
            .send({
                roomid: 'rfidTestRoom',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });
});

describe('POST /rfid/logout', function () {
    it('Should logout', function (done) {
        supertest(server)
            .post('/rfid/logout')
            .send({
                value: 'testTagLogout',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('message', 'Success');

                done();
            });
    });

    it('Should return an error if the tag does not exist', function (done) {
        supertest(server)
            .post('/rfid/logout')
            .send({
                value: 'testTagLogoutBestaatNiet',
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });

    it('Should return an error if the tagId is missing', function (done) {
        supertest(server)
            .post('/rfid/logout')
            .send({})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    });
});

describe('GET \'/rfid/tagid/:appId\'', function () {
    it('Should return the tagId', function (done) {
        supertest(server)
            .get('/rfid/tagid/testAppIdLoggedIn')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('tagId', 'testTagLoggedIn');

                done();
            });
    })

    it('Should return an error if the tag does not exist', function (done) {
        supertest(server)
            .get('/rfid/tagid/testAppIdLoggedInBestaatNiet')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res.body).toHaveProperty('error');

                done();
            });
    })
})