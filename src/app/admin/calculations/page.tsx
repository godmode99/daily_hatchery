import {
  updateFoodDestinationSettingAction,
  updateNurserySettingAction,
} from "@/app/admin/actions";
import { getPrisma } from "@/lib/db/prisma";
import { requireApprovedAdmin } from "@/lib/permissions/require-admin";

export default async function CalculationsPage() {
  await requireApprovedAdmin();
  const [locations, foodSettings, nurserySetting] = await Promise.all([
    getPrisma().growoutLocation.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPrisma().foodDestinationSetting.findMany({
      where: { isActive: true },
      include: { growoutLocation: true },
      orderBy: [{ growoutLocation: { sortOrder: "asc" } }, { effectiveFrom: "desc" }],
    }),
    getPrisma().nurserySetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const latestFoodSettings = new Map(
    foodSettings.map((setting) => [setting.growoutLocationId, setting]),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="text-sm font-medium text-accent">Admin / Calculations</p>
      <h1 className="mt-2 text-3xl font-semibold">ตั้งค่าการคำนวณ</h1>
      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Food destination settings</h2>
        <div className="mt-5 space-y-4">
          {locations.map((location) => {
            const setting = latestFoodSettings.get(location.id);

            return (
              <form
                action={updateFoodDestinationSettingAction}
                className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_180px_180px_auto]"
                key={location.id}
              >
                <input type="hidden" name="growoutLocationId" value={location.id} />
                <p className="font-medium">{location.name}</p>
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2"
                  defaultValue={setting?.targetConcentrationCellsPerMl ?? ""}
                  min="1"
                  name="targetConcentrationCellsPerMl"
                  placeholder="target cells/ml"
                  required
                  type="number"
                />
                <input
                  className="rounded-lg border border-border bg-background px-3 py-2"
                  defaultValue={setting?.waterVolumeLiters ?? ""}
                  min="0.01"
                  name="waterVolumeLiters"
                  placeholder="water liters"
                  required
                  step="any"
                  type="number"
                />
                <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
                  บันทึก
                </button>
              </form>
            );
          })}
        </div>
      </section>
      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Nursery default</h2>
        <form action={updateNurserySettingAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            className="rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={nurserySetting?.defaultDilutionVolumeLiters ?? 10}
            min="0.01"
            name="defaultDilutionVolumeLiters"
            required
            step="any"
            type="number"
          />
          <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
            บันทึก default dilution volume
          </button>
        </form>
      </section>
    </main>
  );
}
