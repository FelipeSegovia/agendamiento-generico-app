// Día y hora de un instante en la zona del profesional: «lunes, 9 de noviembre a las 10:00».
export function formatAppointmentTime(startsAt: string, timezone: string) {
  const date = new Date(startsAt);
  const day = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(date);
  const time = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timezone,
  }).format(date);
  return `${day} a las ${time}`;
}
