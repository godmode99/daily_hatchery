import Link from "next/link";
import { createAutomationRuleAction, toggleAutomationRuleAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

export default async function AdminAutomationPage() {
  await requireApprovedAdmin();
  const prisma = getPrisma();
  const [sensors, actuators, rules, logs] = await Promise.all([
    prisma.sensor.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.actuator.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.automationRule.findMany({
      include: {
        sensorConditions: { include: { sensor: true } },
        actions: { include: { actuator: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    prisma.automationRuleExecutionLog.findMany({
      include: { automationRule: true },
      orderBy: { matchedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link className="text-sm font-medium text-accent" href="/admin">
        กลับศูนย์จัดการ
      </Link>
      <p className="mt-6 text-sm font-medium text-accent">Admin / Automation</p>
      <h1 className="mt-2 text-3xl font-semibold">Automation rules</h1>
      <p className="mt-3 max-w-3xl text-muted">
        ตั้งกฎจากค่า sensor เพื่อสร้าง command queue ให้ actuator อัตโนมัติ
      </p>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">เพิ่ม sensor threshold rule</h2>
        <form action={createAutomationRuleAction} className="mt-4 grid gap-3 lg:grid-cols-2">
          <label className="grid gap-1 text-sm">
            ชื่อกฎ
            <input
              className="rounded-lg border border-border bg-background px-3 py-2"
              name="name"
              placeholder="เช่น pH สูงให้เปิดปั๊มน้ำ"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            รายละเอียด
            <input
              className="rounded-lg border border-border bg-background px-3 py-2"
              name="description"
              placeholder="ไม่บังคับ"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Sensor
            <select className="rounded-lg border border-border bg-background px-3 py-2" name="sensorId" required>
              <option value="">เลือก sensor</option>
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name} ({sensor.code})
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <label className="grid gap-1 text-sm">
              เงื่อนไข
              <select className="rounded-lg border border-border bg-background px-3 py-2" name="operator" required>
                <option value="GT">&gt;</option>
                <option value="GTE">&gt;=</option>
                <option value="LT">&lt;</option>
                <option value="LTE">&lt;=</option>
                <option value="EQ">=</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              ค่า threshold
              <input
                className="rounded-lg border border-border bg-background px-3 py-2"
                name="thresholdValue"
                required
                step="any"
                type="number"
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            Actuator
            <select className="rounded-lg border border-border bg-background px-3 py-2" name="actuatorId" required>
              <option value="">เลือก actuator</option>
              {actuators.map((actuator) => (
                <option key={actuator.id} value={actuator.id}>
                  {actuator.name} ({actuator.code})
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-[160px_auto]">
            <label className="grid gap-1 text-sm">
              Command
              <select className="rounded-lg border border-border bg-background px-3 py-2" name="commandType">
                <option value="ON">ON</option>
                <option value="OFF">OFF</option>
              </select>
            </label>
            <button
              className="self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              type="submit"
            >
              เพิ่มกฎ
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Rules</h2>
        <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
          {rules.map((rule) => (
            <article key={rule.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{rule.name}</h3>
                  <span className="rounded-full bg-background px-2 py-1 text-xs font-medium text-muted">
                    {rule.isActive ? "active" : "disabled"}
                  </span>
                  <span className="rounded-full bg-background px-2 py-1 text-xs font-medium text-muted">
                    {rule.ruleType}
                  </span>
                </div>
                {rule.description ? <p className="mt-2 text-sm text-muted">{rule.description}</p> : null}
                <div className="mt-3 grid gap-2 text-sm text-muted">
                  {rule.sensorConditions.map((condition) => (
                    <p key={condition.id}>
                      ถ้า {condition.sensor.name} ({condition.sensor.code}) {operatorLabel(condition.operator)}{" "}
                      {condition.thresholdValue}
                    </p>
                  ))}
                  {rule.actions.map((action) => (
                    <p key={action.id}>
                      สั่ง {action.actuator.name} ({action.actuator.code}) = {action.commandType}
                    </p>
                  ))}
                </div>
              </div>
              <form action={toggleAutomationRuleAction}>
                <input name="id" type="hidden" value={rule.id} />
                <input name="isActive" type="hidden" value={String(!rule.isActive)} />
                <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium" type="submit">
                  {rule.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </form>
            </article>
          ))}
          {rules.length === 0 ? <p className="p-5 text-sm text-muted">ยังไม่มี automation rules</p> : null}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">System endpoint</h2>
        <p className="mt-2 text-sm text-muted">
          เรียก <span className="font-mono text-foreground">GET /api/system/automation/evaluate</span> พร้อม{" "}
          <span className="font-mono text-foreground">Authorization: Bearer CRON_SECRET</span> เพื่อประเมินกฎและสร้าง
          command queue
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Execution log ล่าสุด</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-background text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-muted">{formatBangkokDateTime(log.matchedAt)}</td>
                  <td className="px-4 py-3 font-medium">{log.automationRule.name}</td>
                  <td className="px-4 py-3 text-muted">{log.executionStatus}</td>
                  <td className="px-4 py-3 text-muted">{log.details ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 ? <p className="px-4 py-6 text-sm text-muted">ยังไม่มี execution log</p> : null}
        </div>
      </section>
    </main>
  );
}

function operatorLabel(operator: string) {
  if (operator === "GT") {
    return ">";
  }

  if (operator === "GTE") {
    return ">=";
  }

  if (operator === "LT") {
    return "<";
  }

  if (operator === "LTE") {
    return "<=";
  }

  return "=";
}
