import { DataMode } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";

export type AdminReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  dataMode?: DataMode;
  includeDeleted?: boolean;
};

export async function getAdminOperationalReport(filters: AdminReportFilters = {}) {
  const dateFrom = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00+07:00`) : startOfBangkokDay();
  const dateTo = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999+07:00`) : endOfBangkokDay();
  const dataMode = filters.dataMode ?? DataMode.REAL;
  const includeDeleted = filters.includeDeleted ?? false;
  const where = {
    dataMode,
    createdAt: { gte: dateFrom, lte: dateTo },
    ...(includeDeleted ? {} : { isDeleted: false }),
  };

  const prisma = getPrisma();
  const [food, growout, nursery, waterPrep] = await Promise.all([
    prisma.foodEntry.findMany({
      where,
      include: {
        planktonType: true,
        createdByUser: true,
        destinations: { include: { growoutLocation: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.growoutEntry.findMany({
      where,
      include: { growoutLocation: true, createdByUser: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.nurseryEntry.findMany({
      where,
      include: { createdByUser: true, counts: { orderBy: { rowNo: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.waterPrepEntry.findMany({
      where,
      include: { waterPrepPoint: true, createdByUser: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    filters: {
      dateFrom,
      dateTo,
      dataMode,
      includeDeleted,
    },
    summary: {
      foodCount: food.length,
      growoutCount: growout.length,
      nurseryCount: nursery.length,
      waterPrepCount: waterPrep.length,
      totalDeadCount: growout.reduce((sum, entry) => sum + entry.deadCount, 0),
      preparedVolumeTons: waterPrep.reduce((sum, entry) => sum + entry.preparedVolumeTons, 0),
    },
    food,
    growout,
    nursery,
    waterPrep,
  };
}

function startOfBangkokDay(now = new Date()) {
  const bangkok = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(bangkok.getUTCFullYear(), bangkok.getUTCMonth(), bangkok.getUTCDate()) - 7 * 60 * 60 * 1000);
}

function endOfBangkokDay(now = new Date()) {
  const start = startOfBangkokDay(now);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}
