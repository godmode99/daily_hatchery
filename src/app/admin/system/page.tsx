import Link from "next/link";
import { runAutomationEvaluateNowAction, runDailySummaryNowAction } from "@/app/admin/actions";
import { requireOwner } from "@/lib/permissions/require-admin";
import { getSystemReadiness } from "@/lib/system/readiness";

export default async function AdminSystemPage() {
  await requireOwner();
  const readiness = await getSystemReadiness();
  const configuredEnvCount = readiness.envChecks.filter((check) => check.isConfigured).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link className="text-sm font-medium text-accent" href="/admin">
        กลับศูนย์จัดการ
      </Link>
      <p className="mt-6 text-sm font-medium text-accent">Admin / System</p>
      <h1 className="mt-2 text-3xl font-semibold">สถานะระบบและ deployment</h1>
      <p className="mt-3 max-w-3xl text-muted">
        ตรวจ env และ integration โดยไม่แสดง secret เต็ม ใช้หน้านี้เช็กก่อน deploy production
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <StatusCard
          label="Environment"
          value={`${configuredEnvCount}/${readiness.envChecks.length}`}
          tone={configuredEnvCount === readiness.envChecks.length ? "good" : "warn"}
        />
        <StatusCard
          label="Telegram rooms"
          value={`${readiness.telegramDestinations.filter((room) => room.isActive).length}/${readiness.telegramDestinations.length}`}
          tone={readiness.telegramDestinations.every((room) => room.isActive) ? "good" : "warn"}
        />
        <StatusCard
          label="Production warnings"
          value={readiness.productionWarnings.length}
          tone={readiness.productionWarnings.length === 0 ? "good" : "warn"}
        />
      </section>

      {readiness.productionWarnings.length > 0 ? (
        <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-lg font-semibold">ต้องเช็กก่อน production</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {readiness.productionWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Manual system jobs</h2>
        <p className="mt-2 text-sm text-muted">
          ใช้สำหรับทดสอบ local หรือหลัง deploy โดยทุกปุ่มจะบันทึก scheduler log เหมือน cron จริง
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={runDailySummaryNowAction}>
            <button
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              type="submit"
            >
              ส่ง Daily Summary ตอนนี้
            </button>
          </form>
          <form action={runAutomationEvaluateNowAction}>
            <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium" type="submit">
              Evaluate Automation ตอนนี้
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Environment variables</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-background text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {readiness.envChecks.map((check) => (
                <tr key={check.key}>
                  <td className="px-4 py-3 font-mono">{check.key}</td>
                  <td className="px-4 py-3">{check.label}</td>
                  <td className="px-4 py-3">
                    <StatusPill ok={check.isConfigured} />
                  </td>
                  <td className="px-4 py-3 text-muted">{check.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Database readiness</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {readiness.databaseChecks.map((check) => (
              <div key={check.label} className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted">{check.label}</p>
                <p className="mt-2 text-2xl font-semibold">{Number(check.value).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Telegram destinations</h2>
          <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {readiness.telegramDestinations.map((room) => (
              <div key={room.roomType} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {room.roomType} · {room.chatIdPreview}
                  </p>
                </div>
                <StatusPill ok={room.isActive} />
              </div>
            ))}
          </div>

          <section className="mt-6 rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Vercel checklist</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>ตั้ง env vars ใน Production, Preview และ Development ให้ครบตามตารางด้านบน</li>
              <li>เพิ่ม production callback URL ใน Google OAuth หลังรู้ Vercel domain</li>
              <li>ตั้ง NEXTAUTH_URL และ APP_BASE_URL เป็น HTTPS domain จริง</li>
              <li>rotate Telegram bot token และ Neon password ก่อนใช้จริง เพราะเคยส่งผ่านแชทแล้ว</li>
              <li>ตรวจ Vercel Cron หลัง deploy production เพราะ cron ไม่รันบน preview deployment</li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: string | number; tone: "good" | "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={tone === "good" ? "mt-2 text-3xl font-semibold text-emerald-700" : "mt-2 text-3xl font-semibold text-amber-700"}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700" : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"}>
      {ok ? "พร้อม" : "ต้องตั้งค่า"}
    </span>
  );
}
