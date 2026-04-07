import type { AwaitedReturn } from "@/lib/types";
import { getAdminOperationalReport } from "@/lib/reports/admin-operational";

type Report = AwaitedReturn<typeof getAdminOperationalReport>;

export function buildOperationalCsv(report: Report) {
  const rows: string[][] = [
    ["category", "created_at", "created_by", "summary", "detail"],
    ...report.food.map((entry) => [
      "Food",
      entry.createdAt.toISOString(),
      entry.createdByUser?.displayName ?? "",
      `${entry.planktonType.nameTh ?? entry.planktonType.nameEn} ${entry.measuredConcentrationCellsPerMl} cells/ml`,
      entry.destinations
        .map(
          (destination) =>
            `${destination.growoutLocation.name}: ${destination.requiredDosingVolumeLiters} L`,
        )
        .join(" | "),
    ]),
    ...report.growout.map((entry) => [
      "Grow-out",
      entry.createdAt.toISOString(),
      entry.createdByUser?.displayName ?? "",
      `${entry.growoutLocation.name} dead ${entry.deadCount}`,
      `pH=${entry.ph ?? ""}; ammonia=${entry.ammonia ?? ""}; nitrite=${entry.nitrite ?? ""}; alkaline=${entry.alkaline ?? ""}; salinity=${entry.salinity ?? ""}`,
    ]),
    ...report.nursery.map((entry) => [
      "Nursery",
      entry.createdAt.toISOString(),
      entry.createdByUser?.displayName ?? "",
      `avg ${entry.averageCount}; total ${entry.totalCells}; density ${entry.densityCellsPerMl}`,
      `counts=${entry.counts.map((count) => count.countValue).join("|")}; pH=${entry.ph ?? ""}; ammonia=${entry.ammonia ?? ""}; nitrite=${entry.nitrite ?? ""}; alkaline=${entry.alkaline ?? ""}; salinity=${entry.salinity ?? ""}`,
    ]),
    ...report.waterPrep.map((entry) => [
      "Water Prep",
      entry.createdAt.toISOString(),
      entry.createdByUser?.displayName ?? "",
      `${entry.waterPrepPoint.name} ${entry.preparedVolumeTons} tons`,
      `salinity=${entry.salinity ?? ""}; pH=${entry.ph ?? ""}; ammonia=${entry.ammonia ?? ""}; nitrite=${entry.nitrite ?? ""}; alkaline=${entry.alkaline ?? ""}`,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
