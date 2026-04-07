import Link from "next/link";
import { createSensorAction, toggleSensorAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

export default async function AdminSensorsPage() {
  await requireApprovedAdmin();
  const prisma = getPrisma();
  const [sensors, recentReadings] = await Promise.all([
    prisma.sensor.findMany({
      include: {
        readings: {
          orderBy: { readingTime: "desc" },
          take: 1,
        },
      },
      orderBy: [{ isActive: "desc" }, { code: "asc" }],
    }),
    prisma.sensorReading.findMany({
      include: { sensor: true },
      orderBy: { readingTime: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link className="text-sm font-medium text-accent" href="/admin">
        กลับศูนย์จัดการ
      </Link>
      <p className="mt-6 text-sm font-medium text-accent">Admin / Sensors</p>
      <h1 className="mt-2 text-3xl font-semibold">เซนเซอร์และค่าล่าสุด</h1>
      <p className="mt-3 max-w-3xl text-muted">
        รับค่าจากอุปกรณ์ผ่าน API แล้วเก็บเป็น readings สำหรับ dashboard และ automation rules
      </p>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">เพิ่ม sensor</h2>
        <form action={createSensorAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_160px_120px_1fr_auto]">
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            name="name"
            placeholder="ชื่อ เช่น Nursery pH"
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 font-mono"
            name="code"
            placeholder="PH_1"
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            name="unit"
            placeholder="unit"
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            name="description"
            placeholder="รายละเอียด"
          />
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
            เพิ่ม
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">ค่าล่าสุดต่อ sensor</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sensors.map((sensor) => {
            const latestReading = sensor.readings[0];

            return (
              <article key={sensor.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{sensor.name}</h3>
                    <p className="mt-1 font-mono text-sm text-muted">{sensor.code}</p>
                  </div>
                  <span className="rounded-full bg-background px-2 py-1 text-xs font-medium text-muted">
                    {sensor.isActive ? "active" : "disabled"}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-semibold">
                  {latestReading ? formatNumber(latestReading.readingValue) : "-"}{" "}
                  <span className="text-base font-medium text-muted">{sensor.unit}</span>
                </p>
                <p className="mt-2 text-sm text-muted">
                  {latestReading ? formatBangkokDateTime(latestReading.readingTime) : "ยังไม่มีข้อมูล"}
                </p>
                {sensor.description ? <p className="mt-3 text-sm text-muted">{sensor.description}</p> : null}
                <form action={toggleSensorAction} className="mt-4">
                  <input name="id" type="hidden" value={sensor.id} />
                  <input name="isActive" type="hidden" value={String(!sensor.isActive)} />
                  <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium" type="submit">
                    {sensor.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">API สำหรับอุปกรณ์</h2>
        <p className="mt-2 text-sm text-muted">
          ส่ง POST ไปที่ <span className="font-mono text-foreground">/api/system/sensors/readings</span> พร้อม header{" "}
          <span className="font-mono text-foreground">Authorization: Bearer SENSOR_INGEST_SECRET</span>
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-background p-4 text-sm">
{`{
  "sourceDeviceId": "farm-controller-1",
  "readings": [
    { "sensorCode": "WATER_TEMP", "value": 28.4 },
    { "sensorCode": "PH", "value": 8.1 }
  ]
}`}
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Readings ล่าสุด</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-background text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">Sensor</th>
                <th className="px-4 py-3 font-medium">ค่า</th>
                <th className="px-4 py-3 font-medium">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentReadings.map((reading) => (
                <tr key={reading.id}>
                  <td className="px-4 py-3 text-muted">{formatBangkokDateTime(reading.readingTime)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{reading.sensor.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{reading.sensor.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    {formatNumber(reading.readingValue)} {reading.sensor.unit}
                  </td>
                  <td className="px-4 py-3 text-muted">{reading.sourceDeviceId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentReadings.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">ยังไม่มี readings จากอุปกรณ์</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH", {
    maximumFractionDigits: 3,
  }).format(value);
}
