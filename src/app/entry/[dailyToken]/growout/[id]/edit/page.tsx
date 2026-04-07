import { redirect } from "next/navigation";
import { updateGrowoutEntryAction } from "@/app/entry/[dailyToken]/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getPrisma } from "@/lib/db/prisma";
import { getWorkerMessages } from "@/lib/i18n/server";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type GrowoutEditPageProps = {
  params: Promise<{ dailyToken: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type WaterQualityDefaults = {
  ph: number | null;
  ammonia: number | null;
  nitrite: number | null;
  alkaline: number | null;
  salinity: number | null;
};

export default async function GrowoutEditPage({ params, searchParams }: GrowoutEditPageProps) {
  const { dailyToken, id } = await params;
  const { error } = await searchParams;
  const { locale, messages } = await getWorkerMessages();
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const [entry, locations] = await Promise.all([
    getPrisma().growoutEntry.findFirst({
      where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
    }),
    getPrisma().growoutLocation.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!entry) {
    redirect(`/entry/${dailyToken}/today`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <LanguageSwitcher currentLocale={locale} path={`/entry/${dailyToken}/growout/${id}/edit`} />
      <p className="mt-6 text-sm font-medium text-accent">Grow-out Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">{messages.growoutEntry}</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          {messages.checkFormAgain}
        </p>
      ) : null}
      <form action={updateGrowoutEntryAction} className="mt-8 space-y-5 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <input type="hidden" name="id" value={id} />
        <label className="block text-sm font-medium">
          Location
          <select
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            name="growoutLocationId"
            defaultValue={entry.growoutLocationId}
            required
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          {messages.deadCountPlaceholder}
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            name="deadCount"
            type="number"
            min="0"
            defaultValue={entry.deadCount}
            required
          />
        </label>
        <WaterQualityFields defaults={entry} />
        <NotesField defaultValue={entry.notes ?? ""} label={messages.notes} />
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground" type="submit">
          {messages.saveEditAndSend}
        </button>
      </form>
    </main>
  );
}

function WaterQualityFields({ defaults }: { defaults: WaterQualityDefaults }) {
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
          <input
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            name={String(name)}
            step="any"
            type="number"
            defaultValue={value ?? ""}
          />
        </label>
      ))}
    </div>
  );
}

function NotesField({ defaultValue, label }: { defaultValue: string; label: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
        name="notes"
        defaultValue={defaultValue}
      />
    </label>
  );
}
