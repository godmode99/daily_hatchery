import Link from "next/link";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

export default async function AdminActivityPage() {
  await requireApprovedAdmin();
  const prisma = getPrisma();
  const [workerAccessLogs, telegramLogs, actuatorCommands, automationLogs, schedulerLogs] = await Promise.all([
    prisma.workerAccessLog.findMany({
      include: {
        person: true,
        dailyLink: true,
        workerKey: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.telegramMessageLog.findMany({
      include: { telegramDestination: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.actuatorCommand.findMany({
      include: { actuator: true, automationRule: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.automationRuleExecutionLog.findMany({
      include: { automationRule: true },
      orderBy: { matchedAt: "desc" },
      take: 50,
    }),
    prisma.schedulerExecutionLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
  ]);

  const summary = [
    ["Worker access", workerAccessLogs.length],
    ["Telegram", telegramLogs.length],
    ["Actuator", actuatorCommands.length],
    ["Automation", automationLogs.length],
    ["Scheduler", schedulerLogs.length],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link className="text-sm font-medium text-accent" href="/admin">
        กลับศูนย์จัดการ
      </Link>
      <p className="mt-6 text-sm font-medium text-accent">Admin / Activity</p>
      <h1 className="mt-2 text-3xl font-semibold">ประวัติกิจกรรมระบบ</h1>
      <p className="mt-3 max-w-3xl text-muted">
        รวม log ล่าสุดจาก worker, Telegram, actuator, automation และ scheduler
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summary.map(([title, value]) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted">{title}</p>
            <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ActivityPanel title="Worker access">
          {workerAccessLogs.map((log) => (
            <ActivityRow
              detail={`${log.person?.displayName ?? "Unknown worker"} · ${log.dailyLink.token.slice(0, 8)}...`}
              key={log.id}
              meta={formatBangkokDateTime(log.createdAt)}
              status={log.actionType}
            />
          ))}
          {workerAccessLogs.length === 0 ? <EmptyRow /> : null}
        </ActivityPanel>

        <ActivityPanel title="Telegram">
          {telegramLogs.map((log) => (
            <ActivityRow
              detail={`${log.telegramDestination.name} · ${trimText(log.payloadText)}`}
              key={log.id}
              meta={formatBangkokDateTime(log.createdAt)}
              status={`${log.messageType} · ${log.sendStatus}`}
            />
          ))}
          {telegramLogs.length === 0 ? <EmptyRow /> : null}
        </ActivityPanel>

        <ActivityPanel title="Actuator commands">
          {actuatorCommands.map((command) => (
            <ActivityRow
              detail={`${command.actuator.name} (${command.actuator.code})${command.automationRule ? ` · ${command.automationRule.name}` : ""}`}
              key={command.id}
              meta={formatBangkokDateTime(command.createdAt)}
              status={`${command.commandType} · ${command.commandSource} · ${command.executionStatus}`}
            />
          ))}
          {actuatorCommands.length === 0 ? <EmptyRow /> : null}
        </ActivityPanel>

        <ActivityPanel title="Automation execution">
          {automationLogs.map((log) => (
            <ActivityRow
              detail={log.details ?? "-"}
              key={log.id}
              meta={formatBangkokDateTime(log.matchedAt)}
              status={`${log.automationRule.name} · ${log.executionStatus}`}
            />
          ))}
          {automationLogs.length === 0 ? <EmptyRow /> : null}
        </ActivityPanel>

        <ActivityPanel title="Scheduler">
          {schedulerLogs.map((log) => (
            <ActivityRow
              detail={log.details ?? log.triggerContext ?? "-"}
              key={log.id}
              meta={formatBangkokDateTime(log.startedAt)}
              status={`${log.jobName} · ${log.status}`}
            />
          ))}
          {schedulerLogs.length === 0 ? <EmptyRow /> : null}
        </ActivityPanel>
      </div>
    </main>
  );
}

function ActivityPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 divide-y divide-border">{children}</div>
    </section>
  );
}

function ActivityRow({
  status,
  detail,
  meta,
}: {
  status: string;
  detail: string;
  meta: string;
}) {
  return (
    <article className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{status}</p>
        <p className="text-xs text-muted">{meta}</p>
      </div>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </article>
  );
}

function EmptyRow() {
  return <p className="py-4 text-sm text-muted">ยังไม่มีข้อมูล</p>;
}

function trimText(value: string) {
  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
}
