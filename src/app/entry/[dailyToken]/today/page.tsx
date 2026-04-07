import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteWorkerEntryAction } from "@/app/entry/[dailyToken]/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getPrisma } from "@/lib/db/prisma";
import { getWorkerMessages } from "@/lib/i18n/server";
import { formatBangkokDateTime } from "@/lib/time/bangkok";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type WorkerTodayPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
};

export default async function WorkerTodayPage({ params }: WorkerTodayPageProps) {
  const { dailyToken } = await params;
  const { locale, messages } = await getWorkerMessages();
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const dailyLinkWhere = { dailyLinkId: verified.dailyLink.id, isDeleted: false };
  const [foodEntries, growoutEntries, nurseryEntries, waterPrepEntries, tasks] = await Promise.all([
    getPrisma().foodEntry.findMany({
      where: dailyLinkWhere,
      include: {
        planktonType: true,
        createdByUser: true,
        destinations: { include: { growoutLocation: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    getPrisma().growoutEntry.findMany({
      where: dailyLinkWhere,
      include: { growoutLocation: true, createdByUser: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    getPrisma().nurseryEntry.findMany({
      where: dailyLinkWhere,
      include: { createdByUser: true, counts: { orderBy: { rowNo: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    getPrisma().waterPrepEntry.findMany({
      where: dailyLinkWhere,
      include: { waterPrepPoint: true, createdByUser: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    getPrisma().forwardTask.findMany({
      where: { isActive: true, isVisibleToWorkers: true },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
  ]);

  const cards = [
    { title: "Food", count: foodEntries.length, href: `/entry/${dailyToken}/food` },
    { title: "Grow-out", count: growoutEntries.length, href: `/entry/${dailyToken}/growout` },
    { title: "Nursery", count: nurseryEntries.length, href: `/entry/${dailyToken}/nursery` },
    { title: "Water Prep", count: waterPrepEntries.length, href: `/entry/${dailyToken}/water-prep` },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <LanguageSwitcher currentLocale={locale} path={`/entry/${dailyToken}/today`} />
      <p className="mt-6 text-sm font-medium text-accent">{messages.today}</p>
      <h1 className="mt-2 text-3xl font-semibold">{messages.todayWork}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {messages.greeting} {verified.person.displayName} {messages.linkCanBeUsedUntil}{" "}
        {formatBangkokDateTime(verified.dailyLink.expiresAt)}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-3 text-3xl font-semibold">{card.count}</p>
            <p className="mt-2 text-sm text-muted">{messages.addEntry}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <DashboardSection title="Food">
          {foodEntries.length > 0 ? (
            foodEntries.map((entry) => (
              <EntryRow
                category="food"
                deleteLabel={messages.delete}
                editHref={`/entry/${dailyToken}/food/${entry.id}/edit`}
                editLabel={messages.edit}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={entry.planktonType.nameTh ?? entry.planktonType.nameEn}
                meta={`${entry.measuredConcentrationCellsPerMl.toLocaleString()} cells/ml · ${
                  entry.createdByUser?.displayName ?? messages.worker
                } · ${formatBangkokDateTime(entry.createdAt)}`}
                detail={entry.destinations
                  .map(
                    (destination) =>
                      `${destination.growoutLocation.name}: ${destination.requiredDosingVolumeLiters.toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 },
                      )} L`,
                  )
                  .join(" | ")}
              />
            ))
          ) : (
            <EmptyRow label={messages.noEntries} />
          )}
        </DashboardSection>

        <DashboardSection title="Grow-out">
          {growoutEntries.length > 0 ? (
            growoutEntries.map((entry) => (
              <EntryRow
                category="growout"
                deleteLabel={messages.delete}
                editHref={`/entry/${dailyToken}/growout/${entry.id}/edit`}
                editLabel={messages.edit}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={entry.growoutLocation.name}
                meta={`dead ${entry.deadCount} · ${entry.createdByUser?.displayName ?? messages.worker} · ${formatBangkokDateTime(
                  entry.createdAt,
                )}`}
                detail={`pH ${entry.ph ?? "-"} · Amm ${entry.ammonia ?? "-"} · Nitrite ${
                  entry.nitrite ?? "-"
                } · Alk ${entry.alkaline ?? "-"} · Salinity ${entry.salinity ?? "-"}`}
              />
            ))
          ) : (
            <EmptyRow label={messages.noEntries} />
          )}
        </DashboardSection>

        <DashboardSection title="Nursery">
          {nurseryEntries.length > 0 ? (
            nurseryEntries.map((entry) => (
              <EntryRow
                category="nursery"
                deleteLabel={messages.delete}
                editHref={`/entry/${dailyToken}/nursery/${entry.id}/edit`}
                editLabel={messages.edit}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={`${entry.counts.length} count rounds`}
                meta={`${entry.createdByUser?.displayName ?? messages.worker} · ${formatBangkokDateTime(entry.createdAt)}`}
                detail={`avg ${entry.averageCount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} · total ${entry.totalCells.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} · density ${entry.densityCellsPerMl.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`}
              />
            ))
          ) : (
            <EmptyRow label={messages.noEntries} />
          )}
        </DashboardSection>

        <DashboardSection title="Water Prep">
          {waterPrepEntries.length > 0 ? (
            waterPrepEntries.map((entry) => (
              <EntryRow
                category="water-prep"
                deleteLabel={messages.delete}
                editHref={`/entry/${dailyToken}/water-prep/${entry.id}/edit`}
                editLabel={messages.edit}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={entry.waterPrepPoint.name}
                meta={`${entry.preparedVolumeTons.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} tons · ${entry.createdByUser?.displayName ?? messages.worker} · ${formatBangkokDateTime(entry.createdAt)}`}
                detail={`Salinity ${entry.salinity ?? "-"} · pH ${entry.ph ?? "-"} · Amm ${
                  entry.ammonia ?? "-"
                } · Nitrite ${entry.nitrite ?? "-"} · Alk ${entry.alkaline ?? "-"}`}
              />
            ))
          ) : (
            <EmptyRow label={messages.noEntries} />
          )}
        </DashboardSection>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{messages.visibleTasks}</h2>
        {tasks.length > 0 ? (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-border p-4">
                <p className="font-medium">{task.name}</p>
                {task.description ? <p className="mt-1 text-sm text-muted">{task.description}</p> : null}
                <p className="mt-2 text-xs text-muted">
                  {messages.starts} {formatBangkokDateTime(task.startDate)} · {messages.repeatsEvery}{" "}
                  {task.repeatEveryNDays} {messages.days}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">{messages.noVisibleTasks}</p>
        )}
      </section>
    </main>
  );
}

function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function EntryRow({
  category,
  deleteLabel,
  editHref,
  editLabel,
  title,
  meta,
  detail,
  id,
  token,
}: {
  category: string;
  deleteLabel: string;
  editHref?: string;
  editLabel: string;
  title: string;
  meta: string;
  detail: string;
  id: string;
  token: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted">{meta}</p>
        </div>
        <form action={deleteWorkerEntryAction}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="id" value={id} />
          <button className="rounded-lg border border-border px-3 py-1 text-xs text-danger" type="submit">
            {deleteLabel}
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      {editHref ? (
        <Link className="mt-3 inline-flex text-xs font-medium text-accent" href={editHref}>
          {editLabel}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-muted">{label}</p>;
}
