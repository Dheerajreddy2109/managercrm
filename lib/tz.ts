import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/** App timezone for "today" and week boundaries. Server-only env; falls back to IST. */
export const APP_TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";

/** YYYY-MM-DD for "now" in the app timezone. */
export const todayInTz = () => formatInTimeZone(new Date(), APP_TZ, "yyyy-MM-dd");

/** A Date whose local fields match the app-timezone wall clock (for date-fns helpers like startOfWeek). */
export const nowInTz = () => toZonedTime(new Date(), APP_TZ);
