import { getAdminOperationalReport } from "@/lib/reports/admin-operational";

export async function buildDailySummaryMessage() {
  const report = await getAdminOperationalReport();

  return [
    "สรุปรายงานฟาร์มรายวัน",
    `Food: ${report.summary.foodCount}`,
    `Grow-out: ${report.summary.growoutCount}`,
    `Nursery: ${report.summary.nurseryCount}`,
    `Water Prep: ${report.summary.waterPrepCount}`,
    `Dead count: ${report.summary.totalDeadCount}`,
    `Prepared water: ${report.summary.preparedVolumeTons.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} tons`,
  ].join("\n");
}
