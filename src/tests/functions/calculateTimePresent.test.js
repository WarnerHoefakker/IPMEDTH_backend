const calculateTimePresent = require('../../calculateTimePresent');
const {describe, it, expect} = require("@jest/globals");

describe('Calculate time present', () => {
    it('Should return 0 hours and 5 minutes', (done) => {
        const fiveMin = 5*60*1000;
        const result = calculateTimePresent(new Date() - fiveMin)

        expect(result).toHaveProperty('hours', 0);
        expect(result).toHaveProperty('minutes', 5);

        done()
    });

    it('Should return 1 hour and 0 minutes', (done) => {
        const oneHour = 60*60*1000;
        const result = calculateTimePresent(new Date() - oneHour)

        expect(result).toHaveProperty('hours', 1);
        expect(result).toHaveProperty('minutes', 0);

        done()
    });

    it('Should return 3 hours and 20 minutes', (done) => {
        const threeHours = 3*60*60*1000;
        const twentyMinutes = 20*60*1000;
        const result = calculateTimePresent(new Date() - threeHours - twentyMinutes);

        expect(result).toHaveProperty('hours', 3);
        expect(result).toHaveProperty('minutes', 20);

        done()
    });

    it('Should return 1 hour and 0 minutes (+ 1 day)', (done) => {
        const oneDay = 25*60*60*1000;
        const result = calculateTimePresent(new Date() - oneDay);

        expect(result).toHaveProperty('hours', 1);
        expect(result).toHaveProperty('minutes', 0);

        done()
    });

    it('Should return an error (startTime is greater than currentTime)', (done) => {
        const date = new Date();
        date.setDate(date.getDate() + 1);

        const result = calculateTimePresent(date)

        expect(result).toHaveProperty('error');

        done()
    })
})