import { createWorkerKeyAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";

export default async function WorkerKeysPage() {
  await requireApprovedAdmin();
  const [people, keys] = await Promise.all([
    getPrisma().person.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
    }),
    getPrisma().workerKey.findMany({
      include: { person: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin / Worker Keys</p>
      <h1 className="mt-2 text-3xl font-semibold">คีย์คนงาน</h1>
      <form action={createWorkerKeyAction} className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_auto]">
        <select className="rounded-lg border border-border bg-background px-3 py-2" name="personId" required>
          <option value="">เลือกคน</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.displayName}
            </option>
          ))}
        </select>
        <input
          className="rounded-lg border border-border bg-background px-3 py-2"
          name="keyValue"
          placeholder="คีย์ เช่น 1234"
          required
        />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          สร้างคีย์
        </button>
      </form>
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
        {keys.map((key) => (
          <div key={key.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{key.person.displayName}</p>
              <p className="font-mono text-sm text-muted">{key.keyMasked ?? "masked"}</p>
            </div>
            <p className="text-sm text-muted">{key.status}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
