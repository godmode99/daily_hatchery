export function formatDailyUrlMessage(input: { url: string; expiresAt: Date }) {
  return [
    "ลิงก์บันทึกงานประจำวัน",
    input.url,
    `หมดอายุ: ${input.expiresAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`,
  ].join("\n");
}

export function formatEntryActivityMessage(input: {
  action: "CREATE" | "UPDATE" | "DELETE";
  category: string;
  actorName: string;
  summary: string;
}) {
  return [
    `รายการ${input.category}: ${input.action}`,
    `ผู้ทำรายการ: ${input.actorName}`,
    input.summary,
    `เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`,
  ].join("\n");
}
