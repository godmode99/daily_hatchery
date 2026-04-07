import { redirect } from "next/navigation";
import { updateNurseryEntryAction } from "@/app/entry/[dailyToken]/actions";
import { getPrisma } from "@/lib/db/prisma";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type NurseryEditPageProps = {
  params: Promise<{ dailyToken: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function NurseryEditPage({ params, searchParams }: NurseryEditPageProps) {
  const { dailyToken, id } = await params;
  const { error } = await searchParams;
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const entry = await getPrisma().nurseryEntry.findFirst({
    where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
    include: { counts: { orderBy: { rowNo: "asc" } } },
  });

  if (!entry) {
    redirect(`/entry/${dailyToken}/today`);
  }

  const countDefaults = [...entry.counts.map((count) => count.countValue), "", "", "", "", ""].slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Nursery Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">แก้ไข Nursery</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          กรุณาใส่ปริมาตรน้ำและผลการนับอย่างน้อย 1 ค่า
        </p>
      ) : null}
      <form action={updateNurseryEntryAction} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <input type="hidden" name="id" value={id} />
        <label className="block text-sm font-medium">
          ปริมาตรน้ำที่ใช้เจือจาง/กระจาย (ลิตร)
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={entry.dilutionWaterVolumeLiters}
            min="0.01"
            name="dilutionWaterVolumeLiters"
            required
            step="any"
            type="number"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-medium">ผลการนับ</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {countDefaults.map((value, index) => (
              <label key={index} className="block text-sm">
                รอบที่ {index + 1}
                <input
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
                  defaultValue={value}
                  min="0"
                  name="counts"
                  step="any"
                  type="number"
                />
              </label>
            ))}
          </div>
        </fieldset>
        <WaterQualityFields defaults={entry} />
        <label className="block text-sm font-medium">
          หมายเหตุ
          <textarea className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2" name="notes" defaultValue={entry.notes ?? ""} />
        </label>
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          บันทึกการแก้ไขและส่ง Telegram
        </button>
      </form>
    </main>
  );
}

function WaterQualityFields({ defaults }: { defaults: { ph: number | null; ammonia: number | null; nitrite: number | null; alkaline: number | null; salinity: number | null } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        ["ph", "pH", defaults.ph],
        ["ammonia", "Ammonia", defaults.ammonia],
        ["nitrite", "Nitrite", defaults.nitrite],
        ["alkaline", "Alkaline", defaults.alkaline],
        ["salinity", "Salinity", defaults.salinity],
      ].map(([name, label, value]) => (
        <label key={String(name)} className="block text-sm font-medium">
          {label}
          <input className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2" name={String(name)} step="any" type="number" defaultValue={value ?? ""} />
        </label>
      ))}
    </div>
  );
}
