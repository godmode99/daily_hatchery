import Link from "next/link";
import { getAdminOperationalReport } from "@/lib/reports/admin-operational";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";

export default async function AdminDashboardPage() {
  await requireApprovedAdmin();
  const report = await getAdminOperationalReport();
  const cards = [
    ["Food", report.summary.foodCount],
    ["Grow-out", report.summary.growoutCount],
    ["Nursery", report.summary.nurseryCount],
    ["Water Prep", report.summary.waterPrepCount],
    ["Dead Count", report.summary.totalDeadCount],
    ["Water Tons", report.summary.preparedVolumeTons],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin / Dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold">ภาพรวมวันนี้</h1>
      <Link className="mt-4 inline-flex text-sm font-medium text-accent" href="/admin/reports">
        เปิดรายงานแบบเลือกช่วงวันที่
      </Link>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([title, value]) => (
          <div key={title} className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted">{title}</p>
            <p className="mt-2 text-3xl font-semibold">{value.toLocaleString()}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">รายการล่าสุด</h2>
        <div className="mt-4 space-y-3">
          {[...report.food.slice(0, 3), ...report.growout.slice(0, 3), ...report.nursery.slice(0, 3), ...report.waterPrep.slice(0, 3)]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10)
            .map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border p-4">
                <p className="font-medium">{entry.createdByUser?.displayName ?? "worker"}</p>
                <p className="mt-1 text-sm text-muted">{entry.createdAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
