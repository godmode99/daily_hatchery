const bangkokOffsetMs = 7 * 60 * 60 * 1000;

export function getCurrentBangkokOperationalWindow(now = new Date()) {
  const bangkokNow = new Date(now.getTime() + bangkokOffsetMs);
  const year = bangkokNow.getUTCFullYear();
  const month = bangkokNow.getUTCMonth();
  const date = bangkokNow.getUTCDate();
  const hour = bangkokNow.getUTCHours();

  const startsAtBangkokDate = hour < 9 ? date - 1 : date;
  const startsAt = Date.UTC(year, month, startsAtBangkokDate, 9) - bangkokOffsetMs;
  const expiresAt = startsAt + 24 * 60 * 60 * 1000;

  return {
    startsAt: new Date(startsAt),
    expiresAt: new Date(expiresAt),
  };
}

export function formatBangkokDateTime(date: Date) {
  return date.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
