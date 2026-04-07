import { redirect } from "next/navigation";
import { createGrowoutEntryAction } from "@/app/entry/[dailyToken]/actions";
import { getPrisma } from "@/lib/db/prisma";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type GrowoutPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function GrowoutPage({ params, searchParams }: GrowoutPageProps) {
  const { dailyToken } = await params;
  const { error } = await searchParams;
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const locations = await getPrisma().growoutLocation.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Grow-out Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">บันทึก Grow-out</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          กรุณาเลือก location และใส่จำนวนตายเป็นตัวเลข 0 ขึ้นไป
        </p>
      ) : null}
      <form action={createGrowoutEntryAction} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <fieldset>
          <legend className="text-sm font-medium">Location และจำนวนตาย</legend>
          <div className="mt-3 space-y-3">
            {locations.map((location) => (
              <div key={location.id} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_160px]">
                <label className="flex items-center gap-2">
                  <input name="locationIds" type="checkbox" value={location.id} />
                  {location.name}
                </label>
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2"
                  min="0"
                  name={`deadCount:${location.id}`}
                  placeholder="จำนวนตาย"
                  type="number"
                />
              </div>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["ph", "pH"],
            ["ammonia", "Ammonia"],
            ["nitrite", "Nitrite"],
            ["alkaline", "Alkaline"],
            ["salinity", "Salinity"],
          ].map(([name, label]) => (
            <label key={name} className="block text-sm font-medium">
              {label}
              <input
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
                name={name}
                step="any"
                type="number"
              />
            </label>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="notes">
            หมายเหตุ
          </label>
          <textarea
            id="notes"
            name="notes"
            className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          บันทึกและส่ง Telegram
        </button>
      </form>
    </main>
  );
}
