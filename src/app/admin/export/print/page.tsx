import { DataMode } from "@prisma/client";
import Link from "next/link";
import { PrintButton } from "@/app/admin/export/print/print-button";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";
import { getAdminOperationalReport } from "@/lib/reports/admin-operational";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

type PrintExportPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    dataMode?: string;
    includeDeleted?: string;
  }>;
};

export default async function PrintExportPage({ searchParams }: PrintExportPageProps) {
  const accessState = await requireApprovedAdmin();
  const query = await searchParams;
  const report = await getAdminOperationalReport({
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    dataMode: query.dataMode === "DEMO" ? DataMode.DEMO : DataMode.REAL,
    includeDeleted: query.includeDeleted === "true",
  });

  return (
    <main className="print-page mx-auto w-full max-w-5xl bg-card px-6 py-10 shadow-sm print:shadow-none">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-medium text-accent" href="/admin/export">
          กลับหน้า Export
        </Link>
        <PrintButton />
      </div>

      <header className="mt-8 border-b border-border pb-6 print:mt-0">
        <p className="text-sm font-medium text-accent">Daily Hatchery</p>
        <h1 className="mt-2 text-3xl font-semibold">รายงานข้อมูลฟาร์ม</h1>
        <dl className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
          <div>
            <dt className="font-medium text-foreground">ช่วงเวลา</dt>
            <dd>
              {formatBangkokDateTime(report.filters.dateFrom)} - {formatBangkokDateTime(report.filters.dateTo)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Data mode</dt>
            <dd>{report.filters.dataMode}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">รวมรายการที่ลบแล้ว</dt>
            <dd>{report.filters.includeDeleted ? "ใช่" : "ไม่ใช่"}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Export โดย</dt>
            <dd>{accessState.adminAccount.person.displayName}</dd>
          </div>
        </dl>
      </header>

      <section className="report-section mt-8">
        <h2 className="text-xl font-semibold">Summary</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard title="Food" value={report.summary.foodCount} />
          <SummaryCard title="Grow-out" value={report.summary.growoutCount} />
          <SummaryCard title="Nursery" value={report.summary.nurseryCount} />
          <SummaryCard title="Water Prep" value={report.summary.waterPrepCount} />
          <SummaryCard title="Dead Count" value={report.summary.totalDeadCount} />
          <SummaryCard title="Prepared Tons" value={report.summary.preparedVolumeTons} />
        </div>
      </section>

      <ReportTable
        columns={["เวลา", "ผู้กรอก", "Plankton", "Concentration", "Destination"]}
        rows={report.food.map((entry) => [
          formatBangkokDateTime(entry.createdAt),
          entry.createdByUser?.displayName ?? "-",
          entry.planktonType.nameTh ?? entry.planktonType.nameEn,
          `${formatNumber(entry.measuredConcentrationCellsPerMl)} cells/ml`,
          entry.destinations
            .map((destination) => `${destination.growoutLocation.name}: ${formatNumber(destination.requiredDosingVolumeLiters)} L`)
            .join(" | "),
        ])}
        title="Food"
      />

      <ReportTable
        columns={["เวลา", "ผู้กรอก", "Location", "Dead", "Water Quality"]}
        rows={report.growout.map((entry) => [
          formatBangkokDateTime(entry.createdAt),
          entry.createdByUser?.displayName ?? "-",
          entry.growoutLocation.name,
          formatNumber(entry.deadCount),
          `pH ${entry.ph ?? "-"} · NH3 ${entry.ammonia ?? "-"} · NO2 ${entry.nitrite ?? "-"} · Alk ${entry.alkaline ?? "-"} · Sal ${entry.salinity ?? "-"}`,
        ])}
        title="Grow-out"
      />

      <ReportTable
        columns={["เวลา", "ผู้กรอก", "Counts", "Average", "Density"]}
        rows={report.nursery.map((entry) => [
          formatBangkokDateTime(entry.createdAt),
          entry.createdByUser?.displayName ?? "-",
          entry.counts.map((count) => formatNumber(count.countValue)).join(" | "),
          formatNumber(entry.averageCount),
          `${formatNumber(entry.densityCellsPerMl)} cells/ml`,
        ])}
        title="Nursery"
      />

      <ReportTable
        columns={["เวลา", "ผู้กรอก", "Point", "Volume", "Water Quality"]}
        rows={report.waterPrep.map((entry) => [
          formatBangkokDateTime(entry.createdAt),
          entry.createdByUser?.displayName ?? "-",
          entry.waterPrepPoint.name,
          `${formatNumber(entry.preparedVolumeTons)} tons`,
          `Sal ${entry.salinity ?? "-"} · pH ${entry.ph ?? "-"} · NH3 ${entry.ammonia ?? "-"} · NO2 ${entry.nitrite ?? "-"} · Alk ${entry.alkaline ?? "-"}`,
        ])}
        title="Water Prep"
      />
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{formatNumber(value)}</p>
    </div>
  );
}

function ReportTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <section className="report-section mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-3 py-4 text-sm text-muted">ไม่มีข้อมูล</p> : null}
      </div>
    </section>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 2,
  }).format(value);
}
