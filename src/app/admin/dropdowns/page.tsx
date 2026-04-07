import { createDropdownItemAction, toggleDropdownItemAction } from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";

export default async function DropdownsPage() {
  await requireApprovedAdmin();
  const [planktonTypes, growoutLocations, waterPrepPoints] = await Promise.all([
    getPrisma().planktonType.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    getPrisma().growoutLocation.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    getPrisma().waterPrepPoint.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin / Dropdowns</p>
      <h1 className="mt-2 text-3xl font-semibold">จัดการ Dropdown</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <DropdownGroup
          group="plankton"
          items={planktonTypes.map((item) => ({
            id: item.id,
            title: item.nameTh ? `${item.nameTh} / ${item.nameEn}` : item.nameEn,
            code: "",
            isActive: item.isActive,
          }))}
          title="Plankton Types"
          type="plankton"
        />
        <DropdownGroup
          group="growout"
          items={growoutLocations.map((item) => ({
            id: item.id,
            title: item.name,
            code: item.code ?? "",
            isActive: item.isActive,
          }))}
          title="Grow-out Locations"
          type="named"
        />
        <DropdownGroup
          group="water-prep"
          items={waterPrepPoints.map((item) => ({
            id: item.id,
            title: item.name,
            code: item.code ?? "",
            isActive: item.isActive,
          }))}
          title="Water Prep Points"
          type="named"
        />
      </div>
    </main>
  );
}

function DropdownGroup({
  group,
  items,
  title,
  type,
}: {
  group: string;
  items: Array<{ id: string; title: string; code: string; isActive: boolean }>;
  title: string;
  type: "plankton" | "named";
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <form action={createDropdownItemAction} className="mt-4 space-y-3">
        <input type="hidden" name="group" value={group} />
        {type === "plankton" ? (
          <>
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" name="nameTh" placeholder="ชื่อไทย" />
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" name="nameEn" placeholder="English name" />
          </>
        ) : (
          <>
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" name="name" placeholder="ชื่อ" />
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2" name="code" placeholder="code optional" />
          </>
        )}
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          เพิ่ม
        </button>
      </form>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-4">
            <p className="font-medium">{item.title}</p>
            {item.code ? <p className="mt-1 font-mono text-xs text-muted">{item.code}</p> : null}
            <form action={toggleDropdownItemAction} className="mt-3">
              <input type="hidden" name="group" value={group} />
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="isActive" value={String(!item.isActive)} />
              <button className="rounded-lg border border-border px-3 py-1 text-xs" type="submit">
                {item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
