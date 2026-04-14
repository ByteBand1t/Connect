const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function pluralize(value: number, singular: string, plural: string): string {
  return value === 1 ? singular : plural;
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / DAY_MS);

  if (dayDiff === 0) {
    return "today";
  }

  if (dayDiff === -1) {
    return "yesterday";
  }

  const isFuture = diffMs > 0;

  if (absMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(absMs / MINUTE_MS));
    return isFuture
      ? `in ${minutes} ${pluralize(minutes, "minute", "minutes")}`
      : `${minutes} ${pluralize(minutes, "minute", "minutes")} ago`;
  }

  if (absMs < DAY_MS) {
    const hours = Math.max(1, Math.round(absMs / HOUR_MS));
    return isFuture
      ? `in ${hours} ${pluralize(hours, "hour", "hours")}`
      : `${hours} ${pluralize(hours, "hour", "hours")} ago`;
  }

  if (absMs < WEEK_MS) {
    const days = Math.max(1, Math.round(absMs / DAY_MS));
    return isFuture
      ? `in ${days} ${pluralize(days, "day", "days")}`
      : `${days} ${pluralize(days, "day", "days")} ago`;
  }

  const weeks = Math.max(1, Math.round(absMs / WEEK_MS));
  return isFuture
    ? `in ${weeks} ${pluralize(weeks, "week", "weeks")}`
    : `${weeks} ${pluralize(weeks, "week", "weeks")} ago`;
}
