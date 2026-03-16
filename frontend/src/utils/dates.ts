import { format } from "date-fns";

const NS_PER_MS = 1_000_000;

export function timestampToDate(timestamp: bigint): Date {
  return new Date(Number(timestamp) / NS_PER_MS);
}

export function timestampToDateString(timestamp: bigint): string {
  return format(timestampToDate(timestamp), "yyyy-MM-dd");
}

export function dateToTimestamp(date: Date): bigint {
  return BigInt(date.getTime() * NS_PER_MS);
}

export function dateStringToTimestamp(dateString: string): bigint {
  return dateToTimestamp(new Date(dateString));
}
