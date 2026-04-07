import { createForwardTaskAction, toggleForwardTaskAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

export default async function TasksPage() {
  await requireApprovedAdmin();
  const tasks = await getPrisma().forwardTask.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin / Tasks</p>
      <h1 className="mt-2 text-3xl font-semibold">Forward Tasks</h1>
      <form action={createForwardTaskAction} className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium">
            ชื่องาน
            <input className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2" name="name" required />
          </label>
          <label className="block text-sm font-medium">
            วันที่เริ่ม
            <input className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2" name="startDate" required type="date" />
          </label>
          <label className="block text-sm font-medium">
            ทำซ้ำทุกกี่วัน
            <input className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2" defaultValue={1} min={1} name="repeatEveryNDays" required type="number" />
          </label>
          <div className="flex flex-col justify-end gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input name="isVisibleToWorkers" type="checkbox" />
              แสดงให้คนงานเห็น
            </label>
            <label className="flex items-center gap-2">
              <input name="isTelegramEnabled" type="checkbox" />
              เปิด Telegram reminder
            </label>
          </div>
        </div>
        <label className="block text-sm font-medium">
          รายละเอียด
          <textarea className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2" name="description" />
        </label>
        <button className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          เพิ่มงาน
        </button>
      </form>
      <div className="mt-8 space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <p className="font-semibold">{task.name}</p>
                {task.description ? <p className="mt-1 text-sm text-muted">{task.description}</p> : null}
                <p className="mt-2 text-sm text-muted">
                  เริ่ม {formatBangkokDateTime(task.startDate)} • ทุก {task.repeatEveryNDays} วัน •{" "}
                  {task.isVisibleToWorkers ? "worker เห็น" : "ซ่อนจาก worker"} •{" "}
                  {task.isTelegramEnabled ? "Telegram on" : "Telegram off"}
                </p>
              </div>
              <form action={toggleForwardTaskAction}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="isActive" value={String(!task.isActive)} />
                <button className="rounded-lg border border-border px-3 py-2 text-sm" type="submit">
                  {task.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
