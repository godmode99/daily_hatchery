import Link from "next/link";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";

type ExportPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    dataMode?: string;
    includeDeleted?: string;
  }>;
};

export default async function ExportPage({ searchParams }: ExportPageProps) {
  await requireApprovedAdmin();
  const query = await searchParams;
  const params = new URLSearchParams();

  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("dataMode", query.dataMode === "DEMO" ? "DEMO" : "REAL");
  if (query.includeDeleted === "true") params.set("includeDeleted", "true");

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link className="text-sm font-medium text-accent" href="/admin">
        กลับศูนย์จัดการ
      </Link>
      <p className="mt-6 text-sm font-medium text-accent">Admin / Export</p>
      <h1 className="mt-2 text-3xl font-semibold">Export ข้อมูลฟาร์ม</h1>
      <p className="mt-3 max-w-2xl text-muted">
        ดาวน์โหลดข้อมูลจากรายงานเดียวกับหน้า Reports เป็น CSV หรือ Excel
      </p>

      <form className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <label className="text-sm font-medium">
          วันที่เริ่ม
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={query.dateFrom ?? ""}
            name="dateFrom"
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          วันที่จบ
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={query.dateTo ?? ""}
            name="dateTo"
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Data mode
          <select
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={query.dataMode ?? "REAL"}
            name="dataMode"
          >
            <option value="REAL">REAL</option>
            <option value="DEMO">DEMO</option>
          </select>
        </label>
        <label className="flex items-end gap-2 text-sm">
          <input
            defaultChecked={query.includeDeleted === "true"}
            name="includeDeleted"
            type="checkbox"
            value="true"
          />
          รวมรายการที่ลบแล้ว
        </label>
        <button className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          เตรียมลิงก์ Export
        </button>
      </form>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">CSV</h2>
          <p className="mt-2 text-sm text-muted">
            เหมาะสำหรับนำไปเปิดใน Google Sheets หรือทำ data processing ต่อ
          </p>
          <a
            className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            href={`/api/admin/export/csv?${params.toString()}`}
          >
            ดาวน์โหลด CSV
          </a>
        </article>

        <article className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Excel</h2>
          <p className="mt-2 text-sm text-muted">
            แยก sheet เป็น Summary, Food, Growout, Nursery และ Water Prep
          </p>
          <a
            className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            href={`/api/admin/export/excel?${params.toString()}`}
          >
            ดาวน์โหลด Excel
          </a>
        </article>

        <article className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">PDF</h2>
          <p className="mt-2 text-sm text-muted">
            เปิดหน้ารายงานสำหรับพิมพ์ แล้วเลือก Save as PDF จาก browser
          </p>
          <a
            className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            href={`/admin/export/print?${params.toString()}`}
            rel="noreferrer"
            target="_blank"
          >
            เปิดรายงาน PDF
          </a>
        </article>
      </section>
    </main>
  );
}
