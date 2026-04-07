import type { AwaitedReturn } from "@/lib/types";
import { getAdminOperationalReport } from "@/lib/reports/admin-operational";

type Report = AwaitedReturn<typeof getAdminOperationalReport>;

type Sheet = {
  name: string;
  rows: Array<Array<string | number | null | undefined>>;
};

export function buildOperationalExcelXml(report: Report) {
  const sheets: Sheet[] = [
    {
      name: "Summary",
      rows: [
        ["Daily Hatchery Export"],
        ["Date From", report.filters.dateFrom.toISOString()],
        ["Date To", report.filters.dateTo.toISOString()],
        ["Data Mode", report.filters.dataMode],
        ["Include Deleted", report.filters.includeDeleted ? "Yes" : "No"],
        [],
        ["Food Entries", report.summary.foodCount],
        ["Grow-out Entries", report.summary.growoutCount],
        ["Nursery Entries", report.summary.nurseryCount],
        ["Water Prep Entries", report.summary.waterPrepCount],
        ["Total Dead Count", report.summary.totalDeadCount],
        ["Prepared Water Tons", report.summary.preparedVolumeTons],
      ],
    },
    {
      name: "Food",
      rows: [
        ["Created At", "Created By", "Plankton", "Measured Concentration", "Destinations", "Notes"],
        ...report.food.map((entry) => [
          entry.createdAt.toISOString(),
          entry.createdByUser?.displayName,
          entry.planktonType.nameTh ?? entry.planktonType.nameEn,
          entry.measuredConcentrationCellsPerMl,
          entry.destinations
            .map(
              (destination) =>
                `${destination.growoutLocation.name}: ${destination.requiredDosingVolumeLiters} L`,
            )
            .join(" | "),
          entry.notes,
        ]),
      ],
    },
    {
      name: "Growout",
      rows: [
        ["Created At", "Created By", "Location", "Dead Count", "pH", "Ammonia", "Nitrite", "Alkaline", "Salinity", "Notes"],
        ...report.growout.map((entry) => [
          entry.createdAt.toISOString(),
          entry.createdByUser?.displayName,
          entry.growoutLocation.name,
          entry.deadCount,
          entry.ph,
          entry.ammonia,
          entry.nitrite,
          entry.alkaline,
          entry.salinity,
          entry.notes,
        ]),
      ],
    },
    {
      name: "Nursery",
      rows: [
        ["Created At", "Created By", "Counts", "Average", "Total Cells", "Density", "pH", "Ammonia", "Nitrite", "Alkaline", "Salinity", "Notes"],
        ...report.nursery.map((entry) => [
          entry.createdAt.toISOString(),
          entry.createdByUser?.displayName,
          entry.counts.map((count) => count.countValue).join(" | "),
          entry.averageCount,
          entry.totalCells,
          entry.densityCellsPerMl,
          entry.ph,
          entry.ammonia,
          entry.nitrite,
          entry.alkaline,
          entry.salinity,
          entry.notes,
        ]),
      ],
    },
    {
      name: "Water Prep",
      rows: [
        ["Created At", "Created By", "Point", "Volume Tons", "Salinity", "pH", "Ammonia", "Nitrite", "Alkaline", "Notes"],
        ...report.waterPrep.map((entry) => [
          entry.createdAt.toISOString(),
          entry.createdByUser?.displayName,
          entry.waterPrepPoint.name,
          entry.preparedVolumeTons,
          entry.salinity,
          entry.ph,
          entry.ammonia,
          entry.nitrite,
          entry.alkaline,
          entry.notes,
        ]),
      ],
    },
  ];

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#D9EAD3" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${sheets.map(buildSheet).join("\n")}
</Workbook>`;
}

function buildSheet(sheet: Sheet) {
  return `<Worksheet ss:Name="${escapeXml(sheet.name)}">
  <Table>
   ${sheet.rows.map(buildRow).join("\n")}
  </Table>
 </Worksheet>`;
}

function buildRow(row: Sheet["rows"][number], rowIndex: number) {
  return `<Row>${row
    .map((cell) => buildCell(cell, rowIndex === 0 && row.some((value) => value !== undefined && value !== null && value !== "")))
    .join("")}</Row>`;
}

function buildCell(value: string | number | null | undefined, isHeader: boolean) {
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const type = isNumber ? "Number" : "String";
  const style = isHeader ? ' ss:StyleID="Header"' : "";
  const text = value === null || value === undefined ? "" : String(value);

  return `<Cell${style}><Data ss:Type="${type}">${escapeXml(text)}</Data></Cell>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
