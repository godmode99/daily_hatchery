import { redirect } from "next/navigation";
import { createNurseryEntryAction } from "@/app/entry/[dailyToken]/actions";
import { getPrisma } from "@/lib/db/prisma";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type NurseryPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NurseryPage({ params, searchParams }: NurseryPageProps) {
  const { dailyToken } = await params;
  const { error } = await searchParams;
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const nurserySetting = await getPrisma().nurserySetting.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Nursery Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">บันทึก Nursery</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          กรุณาใส่ปริมาตรน้ำและผลการนับอย่างน้อย 1 ค่า
        </p>
      ) : null}
      <form action={createNurseryEntryAction} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <div>
          <label className="block text-sm font-medium" htmlFor="dilutionWaterVolumeLiters">
            ปริมาตรน้ำที่ใช้เจือจาง/กระจาย (ลิตร)
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={nurserySetting?.defaultDilutionVolumeLiters ?? 10}
            id="dilutionWaterVolumeLiters"
            min="0.01"
            name="dilutionWaterVolumeLiters"
            required
            step="any"
            type="number"
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">ผลการนับ</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5].map((round) => (
              <label key={round} className="block text-sm">
                รอบที่ {round}
                <input
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
                  min="0"
                  name="counts"
                  placeholder="จำนวน"
                  step="any"
                  type="number"
                />
              </label>
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
