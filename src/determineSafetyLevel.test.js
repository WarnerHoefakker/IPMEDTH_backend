const determineSafetyLevel = require('./determineSafetyLevel');

// co2:     good: 400 - 800,    medium: 800 - 1000,     bad: > 1000
// people:  good: 0%-60%,       medium: 60%-80%,        bad: > 80%

// co2 = good, people = good
test('co2: 700, people: 5, maxPeople: 20, expects: green', () => {
    expect(determineSafetyLevel(700, 5, 20)).toBe('green');
});

// co2 = good, people = medium
test('co2: 700, people: 12, maxPeople: 20, expects: orange', () => {
    expect(determineSafetyLevel(700, 12, 20)).toBe('orange');
});

// co2 = medium, people = good
test('co2: 800, people: 5, maxPeople: 20, expects: orange', () => {
    expect(determineSafetyLevel(800, 5, 20)).toBe('orange');
});

// co2 = medium, people = medium
test('co2: 950, people: 5, maxPeople: 14, expects: orange', () => {
    expect(determineSafetyLevel(950, 14, 20)).toBe('orange');
});

// co2 = good, people = bad
test('co2: 700, people: 16, maxPeople: 20, expects: red', () => {
    expect(determineSafetyLevel(700, 16, 20)).toBe('red');
});

// co2 = bad, people = good
test('co2: 1000, people: 5, maxPeople: 20, expects: red', () => {
    expect(determineSafetyLevel(1000, 5, 20)).toBe('red');
});

// co2 = medium, people = bad
test('co2: 862, people: 20, maxPeople: 20, expects: red', () => {
    expect(determineSafetyLevel(862, 20, 20)).toBe('red');
});

// co2 = bad, people = medium
test('co2: 1400, people: 15, maxPeople: 20, expects: red', () => {
    expect(determineSafetyLevel(1400, 15, 20)).toBe('red');
});

// co2 = bad, people = bad
test('co2: 1400, people: 19, maxPeople: 20, expects: red', () => {
    expect(determineSafetyLevel(1400, 15, 20)).toBe('red');
});

// co2 = medium, people = bad
test('people more than 100%, expects: red', () => {
    expect(determineSafetyLevel(889, 25, 20)).toBe('red');
});

