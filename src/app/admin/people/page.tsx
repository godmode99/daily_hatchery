import { createPersonAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";

export default async function PeoplePage() {
  await requireApprovedAdmin();
  const people = await getPrisma().person.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin / People</p>
      <h1 className="mt-2 text-3xl font-semibold">จัดการคนในฟาร์ม</h1>
      <form action={createPersonAction} className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-[1fr_160px_auto]">
        <input
          className="rounded-lg border border-border bg-background px-3 py-2"
          name="displayName"
          placeholder="ชื่อ"
          required
        />
        <select className="rounded-lg border border-border bg-background px-3 py-2" name="defaultRole">
          <option value="WORKER">Worker</option>
          <option value="HEAD">Head</option>
        </select>
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          เพิ่ม
        </button>
      </form>
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
        {people.map((person) => (
          <div key={person.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{person.displayName}</p>
              <p className="text-sm text-muted">{person.defaultRole}</p>
            </div>
            <p className="text-sm text-muted">{person.isActive ? "active" : "disabled"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
