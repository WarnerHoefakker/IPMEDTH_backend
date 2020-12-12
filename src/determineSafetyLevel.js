const determineSafetyLevel = (co2Value, peopleAmount) => {
    let points = 0;

    points += co2Value;

    if(co2Value > 700){
        points += peopleAmount
    }

    if(points >= 0 && points <= 700){
        return 'good'
    } else if (points > 700 && points <= 1000){
        return 'medium'
    } else if (points > 1000){
        return 'bad'
    } else {
        return 'null'
    }
};

module.exports = determineSafetyLevel;