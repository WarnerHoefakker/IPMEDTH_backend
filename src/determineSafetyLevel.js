// co2:     good: 400 - 800,    medium: 800 - 1000,     bad: > 1000
// people:  good: 0%-60%,       medium: 60%-80%,        bad: > 80%

const determineSafetyLevel = (co2Value, peopleAmount, maxPeople) => {
    const peoplePercentage = peopleAmount / maxPeople * 100;

    if (peoplePercentage >= 80 || co2Value >= 1000)
        return 'red';
    else if ((peoplePercentage >= 60 && peoplePercentage < 80) || (co2Value >= 800 && co2Value < 1000))
        return 'orange';
    else if ((peoplePercentage >= 0 && peoplePercentage < 60) || (co2Value >= 0 && co2Value < 800))
        return 'green';
    else
        return 'grey';
};

module.exports = determineSafetyLevel;