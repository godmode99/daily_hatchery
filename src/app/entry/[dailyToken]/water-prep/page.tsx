import { redirect } from "next/navigation";
import { createWaterPrepEntryAction } from "@/app/entry/[dailyToken]/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getPrisma } from "@/lib/db/prisma";
import { getWorkerMessages } from "@/lib/i18n/server";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type WaterPrepPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function WaterPrepPage({ params, searchParams }: WaterPrepPageProps) {
  const { dailyToken } = await params;
  const { error } = await searchParams;
  const { locale, messages } = await getWorkerMessages();
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const waterPrepPoints = await getPrisma().waterPrepPoint.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <LanguageSwitcher currentLocale={locale} path={`/entry/${dailyToken}/water-prep`} />
      <p className="mt-6 text-sm font-medium text-accent">Water Preparation Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">{messages.waterPrepEntry}</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          {messages.checkFormAgain}
        </p>
      ) : null}
      <form action={createWaterPrepEntryAction} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <div>
          <label className="block text-sm font-medium" htmlFor="waterPrepPointId">
            {messages.waterPrepPoint}
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            id="waterPrepPointId"
            name="waterPrepPointId"
            required
          >
            <option value="">{messages.selectWaterPrepPoint}</option>
            {waterPrepPoints.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="preparedVolumeTons">
            {messages.preparedVolumeTons}
          </label>
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            id="preparedVolumeTons"
            min="0.01"
            name="preparedVolumeTons"
            required
            step="any"
            type="number"
          />
        </div>
        <WaterQualityFields />
        <NotesField label={messages.notes} />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          {messages.saveAndSend}
        </button>
      </form>
    </main>
  );
}

function WaterQualityFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        ["salinity", "Salinity"],
        ["ph", "pH"],
        ["ammonia", "Ammonia"],
        ["nitrite", "Nitrite"],
        ["alkaline", "Alkaline"],
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
  );
}

function NotesField({ label }: { label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium" htmlFor="notes">
        {label}
      </label>
      <textarea
        id="notes"
        name="notes"
        className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
      />
    </div>
  );
}
