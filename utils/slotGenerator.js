const moment = require("moment");

function getBreakTime(duration) {
  if (duration === 90) return 30;
  if (duration === 50 || duration === 60) return 10;
  return 0;
}

function generateSlots(startTime, endTime, duration) {
  const slots = [];

  // ✅ Use 24-hour format
  let start = moment(startTime, "HH:mm");
  const end = moment(endTime, "HH:mm");

  const breakTime = getBreakTime(duration);

  while (start.clone().add(duration, "minutes").isSameOrBefore(end)) {
    const slotStart = start.format("HH:mm");
    const slotEnd = start.clone().add(duration, "minutes").format("HH:mm");

    slots.push({
      start: slotStart,
      end: slotEnd,
      isAvailable: true,
    });

    // move forward with break
    start.add(duration + breakTime, "minutes");
  }

  return slots;
}

module.exports = generateSlots;
