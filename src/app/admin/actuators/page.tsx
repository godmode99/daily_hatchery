import Link from "next/link";
import {
  createActuatorAction,
  issueActuatorCommandAction,
  toggleActuatorAction,
} from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

export default async function AdminActuatorsPage() {
  await requireApprovedAdmin();
  const prisma = getPrisma();
  const [actuators, recentCommands] = await Promise.all([
    prisma.actuator.findMany({
      include: {
        commands: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ isActive: "desc" }, { code: "asc" }],
    }),
    prisma.actuatorCommand.findMany({
      include: { actuator: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link className="text-sm font-medium text-accent" href="/admin">
        กลับศูนย์จัดการ
      </Link>
      <p className="mt-6 text-sm font-medium text-accent">Admin / Actuators</p>
      <h1 className="mt-2 text-3xl font-semibold">อุปกรณ์สั่งงาน</h1>
      <p className="mt-3 max-w-3xl text-muted">
        สร้างคำสั่ง ON/OFF เป็นคิว pending ให้อุปกรณ์จริงมาดึงไปทำงานผ่าน system API
      </p>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">เพิ่ม actuator</h2>
        <form action={createActuatorAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_1fr_auto]">
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            name="name"
            placeholder="ชื่อ เช่น Air Pump 1"
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 font-mono"
            name="code"
            placeholder="AIR_PUMP_1"
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
        <h2 className="text-xl font-semibold">Actuators</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actuators.map((actuator) => {
            const latestCommand = actuator.commands[0];

            return (
              <article key={actuator.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{actuator.name}</h3>
                    <p className="mt-1 font-mono text-sm text-muted">{actuator.code}</p>
                  </div>
                  <span className="rounded-full bg-background px-2 py-1 text-xs font-medium text-muted">
                    {actuator.isActive ? "active" : "disabled"}
                  </span>
                </div>
                {actuator.description ? <p className="mt-3 text-sm text-muted">{actuator.description}</p> : null}
                <div className="mt-5 rounded-lg bg-background p-3 text-sm text-muted">
                  {latestCommand ? (
                    <p>
                      ล่าสุด: {latestCommand.commandType} · {latestCommand.executionStatus} ·{" "}
                      {formatBangkokDateTime(latestCommand.createdAt)}
                    </p>
                  ) : (
                    <p>ยังไม่มีคำสั่ง</p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={issueActuatorCommandAction}>
                    <input name="actuatorId" type="hidden" value={actuator.id} />
                    <input name="commandType" type="hidden" value="ON" />
                    <button
                      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!actuator.isActive}
                      type="submit"
                    >
                      ON
                    </button>
                  </form>
                  <form action={issueActuatorCommandAction}>
                    <input name="actuatorId" type="hidden" value={actuator.id} />
                    <input name="commandType" type="hidden" value="OFF" />
                    <button
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!actuator.isActive}
                      type="submit"
                    >
                      OFF
                    </button>
                  </form>
                  <form action={toggleActuatorAction}>
                    <input name="id" type="hidden" value={actuator.id} />
                    <input name="isActive" type="hidden" value={String(!actuator.isActive)} />
                    <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium" type="submit">
                      {actuator.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">API สำหรับอุปกรณ์</h2>
        <p className="mt-2 text-sm text-muted">
          ดึงคำสั่ง pending ด้วย GET{" "}
          <span className="font-mono text-foreground">/api/system/actuators/commands</span> และอัปเดตผลด้วย PATCH
          โดยใช้ header <span className="font-mono text-foreground">Authorization: Bearer ACTUATOR_DEVICE_SECRET</span>
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-background p-4 text-sm">
{`PATCH /api/system/actuators/commands
{
  "commandId": "uuid",
  "executionStatus": "SUCCESS",
  "responsePayload": { "device": "farm-controller-1" }
}`}
        </pre>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Command log ล่าสุด</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-background text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">Actuator</th>
                <th className="px-4 py-3 font-medium">คำสั่ง</th>
                <th className="px-4 py-3 font-medium">แหล่งที่มา</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentCommands.map((command) => (
                <tr key={command.id}>
                  <td className="px-4 py-3 text-muted">{formatBangkokDateTime(command.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{command.actuator.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{command.actuator.code}</span>
                  </td>
                  <td className="px-4 py-3">{command.commandType}</td>
                  <td className="px-4 py-3 text-muted">{command.commandSource}</td>
                  <td className="px-4 py-3 text-muted">{command.executionStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentCommands.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">ยังไม่มี command log</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
