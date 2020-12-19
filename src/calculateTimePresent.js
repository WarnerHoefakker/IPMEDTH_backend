const calculateTimePresent = (startDate) => {
    const currentTime = new Date();
    const startTime = new Date(startDate);

    let minutes = currentTime.getMinutes() - startTime.getMinutes();
    let hours = currentTime.getHours() - startTime.getHours();

    if (minutes < 0) {
        minutes = 60 - Math.abs(minutes);
        hours -= 1;
    }

    return {hours, minutes}
};

module.exports = calculateTimePresent;