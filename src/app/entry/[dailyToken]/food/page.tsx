import { redirect } from "next/navigation";
import { createFoodEntryAction } from "@/app/entry/[dailyToken]/actions";
import { getPrisma } from "@/lib/db/prisma";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type FoodPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function FoodPage({ params, searchParams }: FoodPageProps) {
  const { dailyToken } = await params;
  const { error } = await searchParams;
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const [planktonTypes, destinationSettings] = await Promise.all([
    getPrisma().planktonType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPrisma().foodDestinationSetting.findMany({
      where: { isActive: true },
      include: { growoutLocation: true },
      orderBy: [{ growoutLocation: { sortOrder: "asc" } }, { effectiveFrom: "desc" }],
    }),
  ]);

  const latestDestinationSettings = Array.from(
    new Map(destinationSettings.map((setting) => [setting.growoutLocationId, setting])).values(),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Food Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">บันทึกอาหารแพลงก์ตอน</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          กรุณาตรวจข้อมูลอีกครั้ง หรือยังไม่ได้ตั้งค่า destination calculation
        </p>
      ) : null}
      <form action={createFoodEntryAction} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <div>
          <label className="block text-sm font-medium" htmlFor="planktonTypeId">
            ชนิดแพลงก์ตอน
          </label>
          <select
            id="planktonTypeId"
            name="planktonTypeId"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            required
          >
            <option value="">เลือกชนิด</option>
            {planktonTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.nameTh ?? type.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="measuredConcentrationCellsPerMl">
            ความเข้มข้นที่วัดได้ (cells/ml)
          </label>
          <input
            id="measuredConcentrationCellsPerMl"
            name="measuredConcentrationCellsPerMl"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            min="1"
            placeholder="เช่น 650000"
            required
            type="number"
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">ปลายทางที่ต้องให้อาหาร</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {latestDestinationSettings.map((setting) => (
              <label key={setting.id} className="rounded-lg border border-border p-4">
                <input className="mr-2" name="destinationIds" type="checkbox" value={setting.growoutLocationId} />
                {setting.growoutLocation.name}
                <span className="mt-1 block text-xs text-muted">
                  target {setting.targetConcentrationCellsPerMl.toLocaleString()} / volume{" "}
                  {setting.waterVolumeLiters.toLocaleString()} L
                </span>
              </label>
            ))}
          </div>
        </fieldset>
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
