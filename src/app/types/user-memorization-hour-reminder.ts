/** One saved hourly memorization reminder slot (local wall clock in an IANA timezone). */
export interface UserMemorizationHourReminderSlot {
  id: string;
  iana_timezone: string;
  local_hour: number;
}
