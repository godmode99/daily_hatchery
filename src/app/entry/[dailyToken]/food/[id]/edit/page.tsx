import { redirect } from "next/navigation";
import { updateFoodEntryAction } from "@/app/entry/[dailyToken]/actions";
import { getPrisma } from "@/lib/db/prisma";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type FoodEditPageProps = {
  params: Promise<{
    dailyToken: string;
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function FoodEditPage({ params, searchParams }: FoodEditPageProps) {
  const { dailyToken, id } = await params;
  const { error } = await searchParams;
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const [entry, planktonTypes, destinationSettings] = await Promise.all([
    getPrisma().foodEntry.findFirst({
      where: {
        id,
        dailyLinkId: verified.dailyLink.id,
        isDeleted: false,
      },
      include: { destinations: true },
    }),
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

  if (!entry) {
    redirect(`/entry/${dailyToken}/today`);
  }

  const selectedDestinationIds = new Set(
    entry.destinations.map((destination) => destination.growoutLocationId),
  );
  const latestDestinationSettings = Array.from(
    new Map(destinationSettings.map((setting) => [setting.growoutLocationId, setting])).values(),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Food Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">แก้ไขอาหารแพลงก์ตอน</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          กรุณาตรวจข้อมูลอีกครั้ง หรือยังไม่ได้ตั้งค่า destination calculation
        </p>
      ) : null}
      <form action={updateFoodEntryAction} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <input type="hidden" name="id" value={id} />
        <div>
          <label className="block text-sm font-medium" htmlFor="planktonTypeId">
            ชนิดแพลงก์ตอน
          </label>
          <select
            id="planktonTypeId"
            name="planktonTypeId"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={entry.planktonTypeId}
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
            defaultValue={entry.measuredConcentrationCellsPerMl}
            min="1"
            required
            type="number"
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">ปลายทางที่ต้องให้อาหาร</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {latestDestinationSettings.map((setting) => (
              <label key={setting.id} className="rounded-lg border border-border p-4">
                <input
                  className="mr-2"
                  defaultChecked={selectedDestinationIds.has(setting.growoutLocationId)}
                  name="destinationIds"
                  type="checkbox"
                  value={setting.growoutLocationId}
                />
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
            defaultValue={entry.notes ?? ""}
          />
        </div>
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          บันทึกการแก้ไขและส่ง Telegram
        </button>
      </form>
    </main>
  );
}
