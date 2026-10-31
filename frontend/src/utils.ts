export function calcAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function hhmm(time: string): string {
  return time.slice(0, 5);
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function getWibNow(): Date {
  const now = new Date();
  const wibString = now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  return new Date(wibString);
}

export function getWibTimeHHMM(): string {
  const d = getWibNow();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function getWibDateISO(offsetDays = 0): string {
  const d = getWibNow();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isTimeInPastWib(timeHHMM: string): boolean {
  const current = getWibTimeHHMM();
  return timeHHMM.slice(0, 5) < current;
}

export function toMinutes(timeHHMM: string): number {
  const [h, m] = timeHHMM.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function isTimeOverlap(
  time1: string,
  dur1: number,
  time2: string,
  dur2: number,
): boolean {
  const start1 = toMinutes(time1);
  const end1 = start1 + dur1;
  const start2 = toMinutes(time2);
  const end2 = start2 + dur2;
  return Math.max(start1, start2) < Math.min(end1, end2);
}

export function isoDayOfWeek(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 ? 7 : day;
}

export function formatDateID(
  dateISO: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", options);
}
