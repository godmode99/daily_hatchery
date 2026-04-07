import { DataMode } from "@prisma/client";
import { getAdminOperationalReport } from "@/lib/reports/admin-operational";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";

type ReportsPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    dataMode?: string;
    includeDeleted?: string;
  }>;
};

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  await requireApprovedAdmin();
  const query = await searchParams;
  const report = await getAdminOperationalReport({
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    dataMode: query.dataMode === "DEMO" ? DataMode.DEMO : DataMode.REAL,
    includeDeleted: query.includeDeleted === "true",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin / Reports</p>
      <h1 className="mt-2 text-3xl font-semibold">รายงานข้อมูลฟาร์ม</h1>
      <form className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[1fr_1fr_160px_160px_auto]">
        <input className="rounded-lg border border-border bg-background px-3 py-2" name="dateFrom" type="date" defaultValue={query.dateFrom ?? ""} />
        <input className="rounded-lg border border-border bg-background px-3 py-2" name="dateTo" type="date" defaultValue={query.dateTo ?? ""} />
        <select className="rounded-lg border border-border bg-background px-3 py-2" name="dataMode" defaultValue={query.dataMode ?? "REAL"}>
          <option value="REAL">REAL</option>
          <option value="DEMO">DEMO</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input name="includeDeleted" type="checkbox" value="true" defaultChecked={query.includeDeleted === "true"} />
          รวมที่ลบ
        </label>
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          ดูรายงาน
        </button>
      </form>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Food", report.summary.foodCount],
          ["Grow-out", report.summary.growoutCount],
          ["Nursery", report.summary.nurseryCount],
          ["Water Prep", report.summary.waterPrepCount],
          ["Dead", report.summary.totalDeadCount],
          ["Tons", report.summary.preparedVolumeTons],
        ].map(([title, value]) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted">{title}</p>
            <p className="mt-2 text-2xl font-semibold">{Number(value).toLocaleString()}</p>
          </div>
        ))}
      </section>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ReportList title="Food" rows={report.food.map((entry) => `${entry.planktonType.nameTh ?? entry.planktonType.nameEn} • ${entry.measuredConcentrationCellsPerMl.toLocaleString()} cells/ml`)} />
        <ReportList title="Grow-out" rows={report.growout.map((entry) => `${entry.growoutLocation.name} • dead ${entry.deadCount}`)} />
        <ReportList title="Nursery" rows={report.nursery.map((entry) => `avg ${entry.averageCount.toLocaleString(undefined, { maximumFractionDigits: 2 })} • density ${entry.densityCellsPerMl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`)} />
        <ReportList title="Water Prep" rows={report.waterPrep.map((entry) => `${entry.waterPrepPoint.name} • ${entry.preparedVolumeTons.toLocaleString()} tons`)} />
      </div>
    </main>
  );
}

function ReportList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length > 0 ? rows.map((row, index) => <p key={index} className="rounded-lg border border-border p-3 text-sm text-muted">{row}</p>) : <p className="text-sm text-muted">ไม่มีข้อมูล</p>}
      </div>
    </section>
  );
}
