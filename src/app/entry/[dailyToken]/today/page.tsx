import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteWorkerEntryAction } from "@/app/entry/[dailyToken]/actions";
import { getPrisma } from "@/lib/db/prisma";
import { formatBangkokDateTime } from "@/lib/time/bangkok";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

type WorkerTodayPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
};

export default async function WorkerTodayPage({ params }: WorkerTodayPageProps) {
  const { dailyToken } = await params;
  const verified = await getVerifiedWorkerForToken(dailyToken);

  if (!verified.ok) {
    redirect(`/entry/${dailyToken}/verify`);
  }

  const dailyLinkWhere = { dailyLinkId: verified.dailyLink.id, isDeleted: false };
  const [
    foodEntries,
    growoutEntries,
    nurseryEntries,
    waterPrepEntries,
    tasks,
  ] = await Promise.all([
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
      <p className="text-sm font-medium text-accent">Today</p>
      <h1 className="mt-2 text-3xl font-semibold">งานวันนี้</h1>
      <p className="mt-3 max-w-2xl text-muted">
        สวัสดี {verified.person.displayName} ลิงก์นี้ใช้ได้ถึง{" "}
        {formatBangkokDateTime(verified.dailyLink.expiresAt)}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-3 text-3xl font-semibold">{card.count}</p>
            <p className="mt-2 text-sm text-muted">เพิ่มรายการ</p>
          </Link>
        ))}
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <DashboardSection title="Food">
          {foodEntries.length > 0 ? (
            foodEntries.map((entry) => (
              <EntryRow
                category="food"
                editHref={`/entry/${dailyToken}/food/${entry.id}/edit`}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={entry.planktonType.nameTh ?? entry.planktonType.nameEn}
                meta={`${entry.measuredConcentrationCellsPerMl.toLocaleString()} cells/ml • ${
                  entry.createdByUser?.displayName ?? "worker"
                } • ${formatBangkokDateTime(entry.createdAt)}`}
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
            <EmptyRow />
          )}
        </DashboardSection>

        <DashboardSection title="Grow-out">
          {growoutEntries.length > 0 ? (
            growoutEntries.map((entry) => (
              <EntryRow
                category="growout"
                editHref={`/entry/${dailyToken}/growout/${entry.id}/edit`}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={entry.growoutLocation.name}
                meta={`dead ${entry.deadCount} • ${entry.createdByUser?.displayName ?? "worker"} • ${formatBangkokDateTime(
                  entry.createdAt,
                )}`}
                detail={`pH ${entry.ph ?? "-"} • Amm ${entry.ammonia ?? "-"} • Nitrite ${
                  entry.nitrite ?? "-"
                } • Alk ${entry.alkaline ?? "-"} • Salinity ${entry.salinity ?? "-"}`}
              />
            ))
          ) : (
            <EmptyRow />
          )}
        </DashboardSection>

        <DashboardSection title="Nursery">
          {nurseryEntries.length > 0 ? (
            nurseryEntries.map((entry) => (
              <EntryRow
                category="nursery"
                editHref={`/entry/${dailyToken}/nursery/${entry.id}/edit`}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={`${entry.counts.length} count rounds`}
                meta={`${entry.createdByUser?.displayName ?? "worker"} • ${formatBangkokDateTime(entry.createdAt)}`}
                detail={`avg ${entry.averageCount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} • total ${entry.totalCells.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} • density ${entry.densityCellsPerMl.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`}
              />
            ))
          ) : (
            <EmptyRow />
          )}
        </DashboardSection>

        <DashboardSection title="Water Prep">
          {waterPrepEntries.length > 0 ? (
            waterPrepEntries.map((entry) => (
              <EntryRow
                category="water-prep"
                editHref={`/entry/${dailyToken}/water-prep/${entry.id}/edit`}
                id={entry.id}
                key={entry.id}
                token={dailyToken}
                title={entry.waterPrepPoint.name}
                meta={`${entry.preparedVolumeTons.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} tons • ${entry.createdByUser?.displayName ?? "worker"} • ${formatBangkokDateTime(entry.createdAt)}`}
                detail={`Salinity ${entry.salinity ?? "-"} • pH ${entry.ph ?? "-"} • Amm ${
                  entry.ammonia ?? "-"
                } • Nitrite ${entry.nitrite ?? "-"} • Alk ${entry.alkaline ?? "-"}`}
              />
            ))
          ) : (
            <EmptyRow />
          )}
        </DashboardSection>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">งานที่หัวหน้าเปิดให้เห็น</h2>
        {tasks.length > 0 ? (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-border p-4">
                <p className="font-medium">{task.name}</p>
                {task.description ? <p className="mt-1 text-sm text-muted">{task.description}</p> : null}
                <p className="mt-2 text-xs text-muted">
                  เริ่ม {formatBangkokDateTime(task.startDate)} • ทำซ้ำทุก {task.repeatEveryNDays} วัน
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">ยังไม่มีงานที่เปิดให้คนงานเห็น</p>
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
  editHref,
  title,
  meta,
  detail,
  id,
  token,
}: {
  category: string;
  editHref?: string;
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
            ลบ
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      {editHref ? (
        <Link className="mt-3 inline-flex text-xs font-medium text-accent" href={editHref}>
          แก้ไข
        </Link>
      ) : null}
    </div>
  );
}

function EmptyRow() {
  return <p className="text-sm text-muted">ยังไม่มีรายการ</p>;
}
