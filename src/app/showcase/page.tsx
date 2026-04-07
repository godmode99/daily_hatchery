import { DataMode } from "@prisma/client";
import Link from "next/link";
import { getAdminOperationalReport } from "@/lib/reports/admin-operational";

const workflow = [
  ["09:00", "ส่งลิงก์ประจำวัน", "คนงานเปิดลิงก์เดียวกันทั้งวันและยืนยันด้วยคีย์ส่วนตัว"],
  ["ระหว่างวัน", "บันทึกงานหน้าโรงเพาะ", "Food, Grow-out, Nursery และ Water Prep อยู่ใน flow เดียวกัน"],
  ["ทันที", "แจ้งเตือนหัวหน้า", "ทุก create, update และ delete ส่งเข้า Telegram activity room"],
  ["18:00", "สรุปรายงาน", "Daily summary ส่งเข้าห้องรายงานและเก็บข้อมูลสำหรับ export"],
] as const;

const capabilities = [
  "Google login สำหรับหัวหน้า",
  "Worker key และ daily link หมดอายุอัตโนมัติ",
  "CSV, Excel และ print-ready PDF",
  "Sensor ingestion และ actuator command queue",
  "Automation rules จาก sensor threshold",
  "Audit logs สำหรับ worker, Telegram, cron และ automation",
] as const;

type DemoRecordGroupProps = {
  eyebrow: string;
  title: string;
  rows: Array<{
    label: string;
    meta: string;
    detail: string;
  }>;
};

export default async function ShowcasePage() {
  const report = await getAdminOperationalReport({ dataMode: DataMode.DEMO });
  const demoRecordGroups = [
    {
      eyebrow: "Plankton dosing",
      title: "Food",
      rows: report.food.slice(0, 2).map((entry) => {
        const totalDose = entry.destinations.reduce((sum, destination) => sum + destination.requiredDosingVolumeLiters, 0);

        return {
          label: displayLookupName(entry.planktonType),
          meta: `${formatNumber(entry.measuredConcentrationCellsPerMl)} cells/ml`,
          detail: `${entry.destinations.length} destinations · ${formatNumber(totalDose, 2)} L dosing`,
        };
      }),
    },
    {
      eyebrow: "Pond health",
      title: "Grow-out",
      rows: report.growout.slice(0, 2).map((entry) => ({
        label: displayLookupName(entry.growoutLocation),
        meta: `${formatNumber(entry.deadCount)} dead count`,
        detail: `pH ${formatOptionalNumber(entry.ph)} · Salinity ${formatOptionalNumber(entry.salinity)}`,
      })),
    },
    {
      eyebrow: "Cell density",
      title: "Nursery",
      rows: report.nursery.slice(0, 2).map((entry) => ({
        label: `${entry.counts.length} count rounds`,
        meta: `Average ${formatNumber(entry.averageCount, 2)}`,
        detail: `${formatNumber(entry.totalCells, 0)} cells · ${formatNumber(entry.densityCellsPerMl, 2)} cells/ml`,
      })),
    },
    {
      eyebrow: "Water preparation",
      title: "Water Prep",
      rows: report.waterPrep.slice(0, 2).map((entry) => ({
        label: displayLookupName(entry.waterPrepPoint),
        meta: `${formatNumber(entry.preparedVolumeTons, 2)} tons`,
        detail: `pH ${formatOptionalNumber(entry.ph)} · Salinity ${formatOptionalNumber(entry.salinity)}`,
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section
        className="relative min-h-[76svh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(7, 29, 23, 0.88), rgba(7, 29, 23, 0.62), rgba(7, 29, 23, 0.18)), url('https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=1800&q=80')",
        }}
      >
        <div className="mx-auto flex min-h-[76svh] w-full max-w-6xl flex-col justify-between px-6 py-8 text-white">
          <nav className="flex items-center justify-between gap-4">
            <Link className="text-sm font-semibold tracking-wide" href="/">
              Daily Hatchery
            </Link>
            <Link className="rounded-lg border border-white/45 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-foreground" href="/admin">
              Admin login
            </Link>
          </nav>

          <div className="max-w-2xl pb-10">
            <p className="text-sm font-medium text-white/80">Hatchery operations</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              งานประจำวันของโรงเพาะอยู่ในลิงก์เดียว
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/82">
              คนงานกรอกข้อมูลจากหน้างาน หัวหน้าเห็นกิจกรรมทันที และรายงานท้ายวันพร้อมส่งต่อ
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/90" href="/admin">
                เข้าศูนย์จัดการ
              </Link>
              <a className="rounded-lg border border-white/45 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-foreground" href="#workflow">
                ดู workflow
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-medium text-accent">Daily flow</p>
          <h2 className="mt-2 text-3xl font-semibold">จากลิงก์เช้า ถึงรายงานเย็น</h2>
          <p className="mt-4 leading-7 text-muted">
            ระบบแยก REAL/DEMO, worker/admin และ operational reports ตั้งแต่ต้นทาง ไม่ต้องรวมข้อมูลทีหลังด้วยมือ
          </p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {workflow.map(([time, title, body]) => (
            <div key={time} className="grid gap-3 py-5 sm:grid-cols-[120px_1fr]">
              <p className="font-mono text-sm text-accent">{time}</p>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-4 border-y border-border py-8 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Food", report.summary.foodCount],
            ["Grow-out", report.summary.growoutCount],
            ["Nursery", report.summary.nurseryCount],
            ["Water Prep", report.summary.waterPrepCount],
            ["Dead", report.summary.totalDeadCount],
            ["Tons", report.summary.preparedVolumeTons],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-medium text-muted">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{Number(value).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          ตัวเลขส่วนนี้มาจาก DEMO data เท่านั้น และไม่อ่านข้อมูล REAL ของฟาร์มจริง
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-accent">Demo records</p>
          <h2 className="mt-2 text-3xl font-semibold">ตัวอย่างรายการที่คนงานกรอกในแต่ละหมวด</h2>
          <p className="mt-4 leading-7 text-muted">
            รายการด้านล่างมาจากชุดข้อมูล DEMO เท่านั้น เพื่อให้เห็นรูปแบบข้อมูลก่อนเปิดใช้งานกับฟาร์มจริง
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {demoRecordGroups.map((group) => (
            <DemoRecordGroup key={group.title} {...group} />
          ))}
        </div>
      </section>

      <section className="bg-[#10251f] text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-white/70">Operational coverage</p>
            <h2 className="mt-2 text-3xl font-semibold">บันทึก ดูแล และสั่งงานจากข้อมูลชุดเดียวกัน</h2>
            <p className="mt-4 leading-7 text-white/72">
              ข้อมูลกรอกประจำวันต่อเข้ากับ Telegram, export, sensor readings, actuator queue และ automation rules
            </p>
          </div>
          <ul className="grid gap-3">
            {capabilities.map((item) => (
              <li key={item} className="border-b border-white/14 pb-3 text-sm leading-6 text-white/82">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Ready for field testing</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold">เริ่มจาก worker flow แล้วค่อยเปิด automation ตามอุปกรณ์จริง</h2>
        </div>
        <Link className="w-fit rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90" href="/admin/system">
          ตรวจ readiness
        </Link>
      </section>
    </main>
  );
}

function DemoRecordGroup({ eyebrow, title, rows }: DemoRecordGroupProps) {
  return (
    <section className="border-y border-border py-5">
      <p className="text-xs font-medium uppercase text-muted">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <div className="mt-4 divide-y divide-border">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={`${row.label}-${row.meta}`} className="py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="font-medium">{row.label}</p>
                <p className="text-sm text-muted">{row.meta}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{row.detail}</p>
            </div>
          ))
        ) : (
          <p className="py-4 text-sm text-muted">ยังไม่มีข้อมูลตัวอย่างในหมวดนี้</p>
        )}
      </div>
    </section>
  );
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("th-TH", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  });
}

function formatOptionalNumber(value: number | null, maximumFractionDigits = 2) {
  if (value === null) {
    return "-";
  }

  return formatNumber(value, maximumFractionDigits);
}

function displayLookupName(lookup: { name: string } | { nameTh: string | null; nameEn: string }) {
  if ("name" in lookup) {
    return lookup.name;
  }

  return lookup.nameTh ?? lookup.nameEn;
}
