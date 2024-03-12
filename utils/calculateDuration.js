module.exports = {
  calculateDurationDateTime: (departureTime, arrivalTime) => {
    const departureDateTime = new Date(departureTime);
    const arrivalDateTime = new Date(arrivalTime);

    const durationInMs = arrivalDateTime - departureDateTime;
    const durationInMinutes = Math.floor(durationInMs / (1000 * 60));

    return durationInMinutes;
  },
};
