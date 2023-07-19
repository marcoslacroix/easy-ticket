function getDateFirstSecond(date) {
    date.setUTCHours(0, 0, 0, 0);
    console.log("primeiro momento do dia: ", date);
    return date;
}

function getDateLastSecond(date) {
    date.setUTCHours(23, 59, 59, 999);
    console.log("ultimo momento do dia: ", date);
    return date;
}

module.exports = {
    getDateFirstSecond,
    getDateLastSecond
}