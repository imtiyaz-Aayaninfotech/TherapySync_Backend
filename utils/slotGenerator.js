const moment = require("moment");

function generateSlots(startTime, endTime, duration) {
  const slots = [];
  let start = moment(startTime, "hh:mm A");
  const end = moment(endTime, "hh:mm A");

  while (start < end) {
    const slotStart = start.format("hh:mm A");
    const slotEnd = start.clone().add(duration, "minutes").format("hh:mm A");

    slots.push({
      start: slotStart,
      end: slotEnd,
      isAvailable: true
    });

    start.add(duration, "minutes");
  }
  return slots;
}

module.exports = generateSlots;
