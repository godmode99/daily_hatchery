"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TelegramRoomType } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import {
  calculateNurseryCounts,
  calculateRequiredDosingVolumeLiters,
} from "@/lib/calculations/hatchery";
import { formatEntryActivityMessage } from "@/lib/telegram/formatters";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { setWorkerVerificationCookie } from "@/lib/worker/session";
import { verifyWorkerKey } from "@/lib/worker/daily-link";
import { getVerifiedWorkerForToken } from "@/lib/worker/session";

export async function verifyWorkerKeyAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const key = String(formData.get("key") ?? "");

  const result = await verifyWorkerKey({ token, key });

  if (!result.ok) {
    redirect(`/entry/${token}/verify?error=${result.error}`);
  }

  await setWorkerVerificationCookie({
    dailyLinkId: result.dailyLink.id,
    workerKeyId: result.workerKey.id,
    personId: result.person.id,
    expiresAt: result.dailyLink.expiresAt,
  });

  redirect(`/entry/${token}/today`);
}

export async function createFoodEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const planktonTypeId = String(formData.get("planktonTypeId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const measuredConcentrationCellsPerMl = Number(
    formData.get("measuredConcentrationCellsPerMl"),
  );
  const destinationIds = formData
    .getAll("destinationIds")
    .map(String)
    .filter(Boolean);

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (
    !planktonTypeId ||
    !Number.isFinite(measuredConcentrationCellsPerMl) ||
    measuredConcentrationCellsPerMl <= 0 ||
    destinationIds.length === 0
  ) {
    redirect(`/entry/${token}/food?error=validation`);
  }

  const prisma = getPrisma();
  const [planktonType, settings] = await Promise.all([
    prisma.planktonType.findUnique({ where: { id: planktonTypeId } }),
    prisma.foodDestinationSetting.findMany({
      where: {
        growoutLocationId: { in: destinationIds },
        isActive: true,
      },
      include: { growoutLocation: true },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);

  const latestSettingByLocation = new Map<string, (typeof settings)[number]>();
  for (const setting of settings) {
    if (!latestSettingByLocation.has(setting.growoutLocationId)) {
      latestSettingByLocation.set(setting.growoutLocationId, setting);
    }
  }

  if (!planktonType || latestSettingByLocation.size !== destinationIds.length) {
    redirect(`/entry/${token}/food?error=missing-settings`);
  }

  const destinationRows = destinationIds.map((growoutLocationId) => {
    const setting = latestSettingByLocation.get(growoutLocationId);

    if (!setting) {
      throw new Error("Missing food destination setting.");
    }

    return {
      growoutLocationId,
      targetConcentrationCellsPerMl: setting.targetConcentrationCellsPerMl,
      waterVolumeLiters: setting.waterVolumeLiters,
      requiredDosingVolumeLiters: calculateRequiredDosingVolumeLiters({
        targetConcentrationCellsPerMl: setting.targetConcentrationCellsPerMl,
        waterVolumeLiters: setting.waterVolumeLiters,
        measuredConcentrationCellsPerMl,
      }),
      name: setting.growoutLocation.name,
    };
  });

  const foodEntry = await prisma.foodEntry.create({
    data: {
      dataMode: "REAL",
      dailyLinkId: verified.dailyLink.id,
      planktonTypeId,
      measuredConcentrationCellsPerMl,
      notes,
      createdByUserId: verified.person.id,
      createdByWorkerKeyId: verified.workerKey.id,
      destinations: {
        create: destinationRows.map((row) => ({
          growoutLocationId: row.growoutLocationId,
          targetConcentrationCellsPerMl: row.targetConcentrationCellsPerMl,
          waterVolumeLiters: row.waterVolumeLiters,
          requiredDosingVolumeLiters: row.requiredDosingVolumeLiters,
        })),
      },
    },
    include: {
      planktonType: true,
      destinations: { include: { growoutLocation: true } },
    },
  });

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "FOOD_CREATE",
    relatedTableName: "food_entries",
    relatedRecordId: foodEntry.id,
    payloadText: formatEntryActivityMessage({
      action: "CREATE",
      category: "Food",
      actorName: verified.person.displayName,
      summary: [
        `แพลงก์ตอน: ${foodEntry.planktonType.nameTh ?? foodEntry.planktonType.nameEn}`,
        `ความเข้มข้นที่วัดได้: ${foodEntry.measuredConcentrationCellsPerMl.toLocaleString()} cells/ml`,
        ...destinationRows.map(
          (row) =>
            `${row.name}: ${row.requiredDosingVolumeLiters.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} L`,
        ),
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function updateFoodEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");
  const planktonTypeId = String(formData.get("planktonTypeId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const measuredConcentrationCellsPerMl = Number(
    formData.get("measuredConcentrationCellsPerMl"),
  );
  const destinationIds = formData
    .getAll("destinationIds")
    .map(String)
    .filter(Boolean);

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (
    !id ||
    !planktonTypeId ||
    !Number.isFinite(measuredConcentrationCellsPerMl) ||
    measuredConcentrationCellsPerMl <= 0 ||
    destinationIds.length === 0
  ) {
    redirect(`/entry/${token}/food/${id}/edit?error=validation`);
  }

  const prisma = getPrisma();
  const existing = await prisma.foodEntry.findFirst({
    where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
  });

  if (!existing) {
    redirect(`/entry/${token}/today`);
  }

  const [planktonType, settings] = await Promise.all([
    prisma.planktonType.findUnique({ where: { id: planktonTypeId } }),
    prisma.foodDestinationSetting.findMany({
      where: {
        growoutLocationId: { in: destinationIds },
        isActive: true,
      },
      include: { growoutLocation: true },
      orderBy: { effectiveFrom: "desc" },
    }),
  ]);

  const latestSettingByLocation = new Map<string, (typeof settings)[number]>();
  for (const setting of settings) {
    if (!latestSettingByLocation.has(setting.growoutLocationId)) {
      latestSettingByLocation.set(setting.growoutLocationId, setting);
    }
  }

  if (!planktonType || latestSettingByLocation.size !== destinationIds.length) {
    redirect(`/entry/${token}/food/${id}/edit?error=missing-settings`);
  }

  const destinationRows = destinationIds.map((growoutLocationId) => {
    const setting = latestSettingByLocation.get(growoutLocationId);

    if (!setting) {
      throw new Error("Missing food destination setting.");
    }

    return {
      growoutLocationId,
      targetConcentrationCellsPerMl: setting.targetConcentrationCellsPerMl,
      waterVolumeLiters: setting.waterVolumeLiters,
      requiredDosingVolumeLiters: calculateRequiredDosingVolumeLiters({
        targetConcentrationCellsPerMl: setting.targetConcentrationCellsPerMl,
        waterVolumeLiters: setting.waterVolumeLiters,
        measuredConcentrationCellsPerMl,
      }),
      name: setting.growoutLocation.name,
    };
  });

  const foodEntry = await prisma.$transaction(async (tx) => {
    await tx.foodEntryDestination.deleteMany({
      where: { foodEntryId: id },
    });

    return tx.foodEntry.update({
      where: { id },
      data: {
        planktonTypeId,
        measuredConcentrationCellsPerMl,
        notes,
        updatedByUserId: verified.person.id,
        destinations: {
          create: destinationRows.map((row) => ({
            growoutLocationId: row.growoutLocationId,
            targetConcentrationCellsPerMl: row.targetConcentrationCellsPerMl,
            waterVolumeLiters: row.waterVolumeLiters,
            requiredDosingVolumeLiters: row.requiredDosingVolumeLiters,
          })),
        },
      },
      include: {
        planktonType: true,
      },
    });
  });

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "FOOD_UPDATE",
    relatedTableName: "food_entries",
    relatedRecordId: foodEntry.id,
    payloadText: formatEntryActivityMessage({
      action: "UPDATE",
      category: "Food",
      actorName: verified.person.displayName,
      summary: [
        `แพลงก์ตอน: ${foodEntry.planktonType.nameTh ?? foodEntry.planktonType.nameEn}`,
        `ความเข้มข้นที่วัดได้: ${foodEntry.measuredConcentrationCellsPerMl.toLocaleString()} cells/ml`,
        ...destinationRows.map(
          (row) =>
            `${row.name}: ${row.requiredDosingVolumeLiters.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} L`,
        ),
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function createGrowoutEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const locationIds = formData
    .getAll("locationIds")
    .map(String)
    .filter(Boolean);
  const ph = parseOptionalNumber(formData.get("ph"));
  const ammonia = parseOptionalNumber(formData.get("ammonia"));
  const nitrite = parseOptionalNumber(formData.get("nitrite"));
  const alkaline = parseOptionalNumber(formData.get("alkaline"));
  const salinity = parseOptionalNumber(formData.get("salinity"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  const rows = locationIds.map((locationId) => ({
    growoutLocationId: locationId,
    deadCount: Number(formData.get(`deadCount:${locationId}`)),
  }));

  if (rows.length === 0 || rows.some((row) => !Number.isInteger(row.deadCount) || row.deadCount < 0)) {
    redirect(`/entry/${token}/growout?error=validation`);
  }

  const locations = await getPrisma().growoutLocation.findMany({
    where: { id: { in: locationIds }, isActive: true },
  });

  if (locations.length !== rows.length) {
    redirect(`/entry/${token}/growout?error=validation`);
  }

  await getPrisma().growoutEntry.createMany({
    data: rows.map((row) => ({
      dataMode: "REAL",
      dailyLinkId: verified.dailyLink.id,
      growoutLocationId: row.growoutLocationId,
      deadCount: row.deadCount,
      ph,
      ammonia,
      nitrite,
      alkaline,
      salinity,
      notes,
      createdByUserId: verified.person.id,
      createdByWorkerKeyId: verified.workerKey.id,
    })),
  });

  const locationNameById = new Map(locations.map((location) => [location.id, location.name]));

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "GROWOUT_CREATE",
    relatedTableName: "growout_entries",
    payloadText: formatEntryActivityMessage({
      action: "CREATE",
      category: "Grow-out",
      actorName: verified.person.displayName,
      summary: [
        ...rows.map((row) => `${locationNameById.get(row.growoutLocationId)}: dead ${row.deadCount}`),
        `pH: ${ph ?? "-"}`,
        `Ammonia: ${ammonia ?? "-"}`,
        `Nitrite: ${nitrite ?? "-"}`,
        `Alkaline: ${alkaline ?? "-"}`,
        `Salinity: ${salinity ?? "-"}`,
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function updateGrowoutEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");
  const growoutLocationId = String(formData.get("growoutLocationId") ?? "");
  const deadCount = Number(formData.get("deadCount"));
  const ph = parseOptionalNumber(formData.get("ph"));
  const ammonia = parseOptionalNumber(formData.get("ammonia"));
  const nitrite = parseOptionalNumber(formData.get("nitrite"));
  const alkaline = parseOptionalNumber(formData.get("alkaline"));
  const salinity = parseOptionalNumber(formData.get("salinity"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (!id || !growoutLocationId || !Number.isInteger(deadCount) || deadCount < 0) {
    redirect(`/entry/${token}/growout/${id}/edit?error=validation`);
  }

  const existing = await getPrisma().growoutEntry.findFirst({
    where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
  });

  if (!existing) {
    redirect(`/entry/${token}/today`);
  }

  const location = await getPrisma().growoutLocation.findUnique({
    where: { id: growoutLocationId },
  });

  if (!location || !location.isActive) {
    redirect(`/entry/${token}/growout/${id}/edit?error=validation`);
  }

  const entry = await getPrisma().growoutEntry.update({
    where: { id },
    data: {
      growoutLocationId,
      deadCount,
      ph,
      ammonia,
      nitrite,
      alkaline,
      salinity,
      notes,
      updatedByUserId: verified.person.id,
    },
  });

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "GROWOUT_UPDATE",
    relatedTableName: "growout_entries",
    relatedRecordId: entry.id,
    payloadText: formatEntryActivityMessage({
      action: "UPDATE",
      category: "Grow-out",
      actorName: verified.person.displayName,
      summary: [
        `${location.name}: dead ${entry.deadCount}`,
        `pH: ${ph ?? "-"}`,
        `Ammonia: ${ammonia ?? "-"}`,
        `Nitrite: ${nitrite ?? "-"}`,
        `Alkaline: ${alkaline ?? "-"}`,
        `Salinity: ${salinity ?? "-"}`,
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function createNurseryEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const dilutionWaterVolumeLiters = Number(formData.get("dilutionWaterVolumeLiters"));
  const counts = formData
    .getAll("counts")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map(Number);
  const ph = parseOptionalNumber(formData.get("ph"));
  const ammonia = parseOptionalNumber(formData.get("ammonia"));
  const nitrite = parseOptionalNumber(formData.get("nitrite"));
  const alkaline = parseOptionalNumber(formData.get("alkaline"));
  const salinity = parseOptionalNumber(formData.get("salinity"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (
    !Number.isFinite(dilutionWaterVolumeLiters) ||
    dilutionWaterVolumeLiters <= 0 ||
    counts.length === 0 ||
    counts.some((count) => !Number.isFinite(count) || count < 0)
  ) {
    redirect(`/entry/${token}/nursery?error=validation`);
  }

  const calculation = calculateNurseryCounts({
    counts,
    dilutionWaterVolumeLiters,
  });

  const nurseryEntry = await getPrisma().nurseryEntry.create({
    data: {
      dataMode: "REAL",
      dailyLinkId: verified.dailyLink.id,
      dilutionWaterVolumeLiters,
      averageCount: calculation.averageCount,
      totalCells: calculation.totalCells,
      densityCellsPerMl: calculation.densityCellsPerMl,
      ph,
      ammonia,
      nitrite,
      alkaline,
      salinity,
      notes,
      createdByUserId: verified.person.id,
      createdByWorkerKeyId: verified.workerKey.id,
      counts: {
        create: counts.map((countValue, index) => ({
          rowNo: index + 1,
          countValue,
        })),
      },
    },
  });

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "NURSERY_CREATE",
    relatedTableName: "nursery_entries",
    relatedRecordId: nurseryEntry.id,
    payloadText: formatEntryActivityMessage({
      action: "CREATE",
      category: "Nursery",
      actorName: verified.person.displayName,
      summary: [
        `จำนวนรอบนับ: ${counts.length}`,
        `Average: ${calculation.averageCount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        `Total cells: ${calculation.totalCells.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        `Density: ${calculation.densityCellsPerMl.toLocaleString(undefined, { maximumFractionDigits: 2 })} cells/ml`,
        `pH: ${ph ?? "-"}`,
        `Ammonia: ${ammonia ?? "-"}`,
        `Nitrite: ${nitrite ?? "-"}`,
        `Alkaline: ${alkaline ?? "-"}`,
        `Salinity: ${salinity ?? "-"}`,
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function updateNurseryEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");
  const dilutionWaterVolumeLiters = Number(formData.get("dilutionWaterVolumeLiters"));
  const counts = formData
    .getAll("counts")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map(Number);
  const ph = parseOptionalNumber(formData.get("ph"));
  const ammonia = parseOptionalNumber(formData.get("ammonia"));
  const nitrite = parseOptionalNumber(formData.get("nitrite"));
  const alkaline = parseOptionalNumber(formData.get("alkaline"));
  const salinity = parseOptionalNumber(formData.get("salinity"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (
    !id ||
    !Number.isFinite(dilutionWaterVolumeLiters) ||
    dilutionWaterVolumeLiters <= 0 ||
    counts.length === 0 ||
    counts.some((count) => !Number.isFinite(count) || count < 0)
  ) {
    redirect(`/entry/${token}/nursery/${id}/edit?error=validation`);
  }

  const existing = await getPrisma().nurseryEntry.findFirst({
    where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
  });

  if (!existing) {
    redirect(`/entry/${token}/today`);
  }

  const calculation = calculateNurseryCounts({
    counts,
    dilutionWaterVolumeLiters,
  });

  const nurseryEntry = await getPrisma().$transaction(async (tx) => {
    await tx.nurseryEntryCount.deleteMany({
      where: { nurseryEntryId: id },
    });

    return tx.nurseryEntry.update({
      where: { id },
      data: {
        dilutionWaterVolumeLiters,
        averageCount: calculation.averageCount,
        totalCells: calculation.totalCells,
        densityCellsPerMl: calculation.densityCellsPerMl,
        ph,
        ammonia,
        nitrite,
        alkaline,
        salinity,
        notes,
        updatedByUserId: verified.person.id,
        counts: {
          create: counts.map((countValue, index) => ({
            rowNo: index + 1,
            countValue,
          })),
        },
      },
    });
  });

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "NURSERY_UPDATE",
    relatedTableName: "nursery_entries",
    relatedRecordId: nurseryEntry.id,
    payloadText: formatEntryActivityMessage({
      action: "UPDATE",
      category: "Nursery",
      actorName: verified.person.displayName,
      summary: [
        `จำนวนรอบนับ: ${counts.length}`,
        `Average: ${calculation.averageCount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        `Total cells: ${calculation.totalCells.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        `Density: ${calculation.densityCellsPerMl.toLocaleString(undefined, { maximumFractionDigits: 2 })} cells/ml`,
        `pH: ${ph ?? "-"}`,
        `Ammonia: ${ammonia ?? "-"}`,
        `Nitrite: ${nitrite ?? "-"}`,
        `Alkaline: ${alkaline ?? "-"}`,
        `Salinity: ${salinity ?? "-"}`,
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function createWaterPrepEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const waterPrepPointId = String(formData.get("waterPrepPointId") ?? "");
  const preparedVolumeTons = Number(formData.get("preparedVolumeTons"));
  const salinity = parseOptionalNumber(formData.get("salinity"));
  const ph = parseOptionalNumber(formData.get("ph"));
  const ammonia = parseOptionalNumber(formData.get("ammonia"));
  const nitrite = parseOptionalNumber(formData.get("nitrite"));
  const alkaline = parseOptionalNumber(formData.get("alkaline"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (!waterPrepPointId || !Number.isFinite(preparedVolumeTons) || preparedVolumeTons <= 0) {
    redirect(`/entry/${token}/water-prep?error=validation`);
  }

  const waterPrepPoint = await getPrisma().waterPrepPoint.findUnique({
    where: { id: waterPrepPointId },
  });

  if (!waterPrepPoint || !waterPrepPoint.isActive) {
    redirect(`/entry/${token}/water-prep?error=validation`);
  }

  const waterPrepEntry = await getPrisma().waterPrepEntry.create({
    data: {
      dataMode: "REAL",
      dailyLinkId: verified.dailyLink.id,
      waterPrepPointId,
      preparedVolumeTons,
      salinity,
      ph,
      ammonia,
      nitrite,
      alkaline,
      notes,
      createdByUserId: verified.person.id,
      createdByWorkerKeyId: verified.workerKey.id,
    },
  });

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "WATER_PREP_CREATE",
    relatedTableName: "water_prep_entries",
    relatedRecordId: waterPrepEntry.id,
    payloadText: formatEntryActivityMessage({
      action: "CREATE",
      category: "Water Preparation",
      actorName: verified.person.displayName,
      summary: [
        `จุดเตรียมน้ำ: ${waterPrepPoint.name}`,
        `ปริมาตร: ${preparedVolumeTons.toLocaleString(undefined, { maximumFractionDigits: 2 })} tons`,
        `Salinity: ${salinity ?? "-"}`,
        `pH: ${ph ?? "-"}`,
        `Ammonia: ${ammonia ?? "-"}`,
        `Nitrite: ${nitrite ?? "-"}`,
        `Alkaline: ${alkaline ?? "-"}`,
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function updateWaterPrepEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");
  const waterPrepPointId = String(formData.get("waterPrepPointId") ?? "");
  const preparedVolumeTons = Number(formData.get("preparedVolumeTons"));
  const salinity = parseOptionalNumber(formData.get("salinity"));
  const ph = parseOptionalNumber(formData.get("ph"));
  const ammonia = parseOptionalNumber(formData.get("ammonia"));
  const nitrite = parseOptionalNumber(formData.get("nitrite"));
  const alkaline = parseOptionalNumber(formData.get("alkaline"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (!id || !waterPrepPointId || !Number.isFinite(preparedVolumeTons) || preparedVolumeTons <= 0) {
    redirect(`/entry/${token}/water-prep/${id}/edit?error=validation`);
  }

  const existing = await getPrisma().waterPrepEntry.findFirst({
    where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
  });

  if (!existing) {
    redirect(`/entry/${token}/today`);
  }

  const waterPrepPoint = await getPrisma().waterPrepPoint.findUnique({
    where: { id: waterPrepPointId },
  });

  if (!waterPrepPoint || !waterPrepPoint.isActive) {
    redirect(`/entry/${token}/water-prep/${id}/edit?error=validation`);
  }

  const entry = await getPrisma().waterPrepEntry.update({
    where: { id },
    data: {
      waterPrepPointId,
      preparedVolumeTons,
      salinity,
      ph,
      ammonia,
      nitrite,
      alkaline,
      notes,
      updatedByUserId: verified.person.id,
    },
  });

  await sendTelegramMessage({
    roomType: TelegramRoomType.ENTRY_ACTIVITY,
    messageType: "WATER_PREP_UPDATE",
    relatedTableName: "water_prep_entries",
    relatedRecordId: entry.id,
    payloadText: formatEntryActivityMessage({
      action: "UPDATE",
      category: "Water Preparation",
      actorName: verified.person.displayName,
      summary: [
        `จุดเตรียมน้ำ: ${waterPrepPoint.name}`,
        `ปริมาตร: ${preparedVolumeTons.toLocaleString(undefined, { maximumFractionDigits: 2 })} tons`,
        `Salinity: ${salinity ?? "-"}`,
        `pH: ${ph ?? "-"}`,
        `Ammonia: ${ammonia ?? "-"}`,
        `Nitrite: ${nitrite ?? "-"}`,
        `Alkaline: ${alkaline ?? "-"}`,
      ].join("\n"),
    }),
  });

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

export async function deleteWorkerEntryAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const category = String(formData.get("category") ?? "");
  const id = String(formData.get("id") ?? "");

  const verified = await getVerifiedWorkerForToken(token);

  if (!verified.ok) {
    redirect(`/entry/${token}/verify`);
  }

  if (!id) {
    redirect(`/entry/${token}/today`);
  }

  const prisma = getPrisma();
  const deletedAt = new Date();
  let deletedSummary: string | null = null;
  let messageType: string | null = null;
  let relatedTableName: string | null = null;

  if (category === "food") {
    const record = await prisma.foodEntry.findFirst({
      where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
      include: { planktonType: true },
    });

    if (record) {
      await prisma.foodEntry.update({
        where: { id },
        data: { isDeleted: true, deletedAt, deletedByUserId: verified.person.id },
      });
      deletedSummary = `ลบ Food: ${record.planktonType.nameTh ?? record.planktonType.nameEn}`;
      messageType = "FOOD_DELETE";
      relatedTableName = "food_entries";
    }
  }

  if (category === "growout") {
    const record = await prisma.growoutEntry.findFirst({
      where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
      include: { growoutLocation: true },
    });

    if (record) {
      await prisma.growoutEntry.update({
        where: { id },
        data: { isDeleted: true, deletedAt, deletedByUserId: verified.person.id },
      });
      deletedSummary = `ลบ Grow-out: ${record.growoutLocation.name} dead ${record.deadCount}`;
      messageType = "GROWOUT_DELETE";
      relatedTableName = "growout_entries";
    }
  }

  if (category === "nursery") {
    const record = await prisma.nurseryEntry.findFirst({
      where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
    });

    if (record) {
      await prisma.nurseryEntry.update({
        where: { id },
        data: { isDeleted: true, deletedAt, deletedByUserId: verified.person.id },
      });
      deletedSummary = `ลบ Nursery: average ${record.averageCount.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`;
      messageType = "NURSERY_DELETE";
      relatedTableName = "nursery_entries";
    }
  }

  if (category === "water-prep") {
    const record = await prisma.waterPrepEntry.findFirst({
      where: { id, dailyLinkId: verified.dailyLink.id, isDeleted: false },
      include: { waterPrepPoint: true },
    });

    if (record) {
      await prisma.waterPrepEntry.update({
        where: { id },
        data: { isDeleted: true, deletedAt, deletedByUserId: verified.person.id },
      });
      deletedSummary = `ลบ Water Prep: ${record.waterPrepPoint.name} ${record.preparedVolumeTons} tons`;
      messageType = "WATER_PREP_DELETE";
      relatedTableName = "water_prep_entries";
    }
  }

  if (deletedSummary && messageType && relatedTableName) {
    await sendTelegramMessage({
      roomType: TelegramRoomType.ENTRY_ACTIVITY,
      messageType,
      relatedTableName,
      relatedRecordId: id,
      payloadText: formatEntryActivityMessage({
        action: "DELETE",
        category,
        actorName: verified.person.displayName,
        summary: deletedSummary,
      }),
    });
  }

  revalidatePath(`/entry/${token}/today`);
  redirect(`/entry/${token}/today`);
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
