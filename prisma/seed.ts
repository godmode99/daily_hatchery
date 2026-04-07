import "dotenv/config";
import { AdminRole, ApprovalStatus, DefaultRole, TelegramRoomType } from "@prisma/client";
import { getPrisma } from "../src/lib/db/prisma";

const prisma = getPrisma();

const ownerEmail = process.env.INITIAL_OWNER_EMAIL ?? "bestpratice168@gmail.com";

async function main() {
  const ownerPerson = await prisma.person.upsert({
    where: { id: "seed-owner-person" },
    update: {
      displayName: "Owner",
      defaultRole: DefaultRole.OWNER,
      isActive: true,
    },
    create: {
      id: "seed-owner-person",
      displayName: "Owner",
      defaultRole: DefaultRole.OWNER,
      isActive: true,
    },
  });

  await prisma.adminAccount.upsert({
    where: { googleEmail: ownerEmail },
    update: {
      personId: ownerPerson.id,
      adminRole: AdminRole.OWNER,
      approvalStatus: ApprovalStatus.APPROVED,
    },
    create: {
      personId: ownerPerson.id,
      googleEmail: ownerEmail,
      adminRole: AdminRole.OWNER,
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  await Promise.all([
    prisma.planktonType.upsert({
      where: { id: "seed-plankton-isochrysis" },
      update: {},
      create: {
        id: "seed-plankton-isochrysis",
        nameEn: "Isochrysis",
        nameTh: "ไอโซไครซิส",
        sortOrder: 1,
      },
    }),
    prisma.planktonType.upsert({
      where: { id: "seed-plankton-chaetoceros" },
      update: {},
      create: {
        id: "seed-plankton-chaetoceros",
        nameEn: "Chaetoceros",
        nameTh: "คีโตเซอรอส",
        sortOrder: 2,
      },
    }),
    prisma.planktonType.upsert({
      where: { id: "seed-plankton-tetraselmis" },
      update: {},
      create: {
        id: "seed-plankton-tetraselmis",
        nameEn: "Tetraselmis",
        nameTh: "เตตราเซลมิส",
        sortOrder: 3,
      },
    }),
  ]);

  const growoutLocations = [
    ["seed-growout-condo-1", "Condo 1", "CONDO_1", 1],
    ["seed-growout-condo-2", "Condo 2", "CONDO_2", 2],
    ["seed-growout-upwelling", "Upwelling", "UPWELLING", 3],
  ] as const;

  for (const [id, name, code, sortOrder] of growoutLocations) {
    await prisma.growoutLocation.upsert({
      where: { id },
      update: { name, code, sortOrder },
      create: { id, name, code, sortOrder },
    });
  }

  const foodDestinationDefaults = [
    ["seed-food-setting-condo-1", "seed-growout-condo-1", 100000, 1000],
    ["seed-food-setting-condo-2", "seed-growout-condo-2", 100000, 1000],
    ["seed-food-setting-upwelling", "seed-growout-upwelling", 100000, 500],
  ] as const;

  for (const [id, growoutLocationId, targetConcentrationCellsPerMl, waterVolumeLiters] of foodDestinationDefaults) {
    await prisma.foodDestinationSetting.upsert({
      where: { id },
      update: {
        growoutLocationId,
        targetConcentrationCellsPerMl,
        waterVolumeLiters,
        effectiveFrom: new Date("2026-04-07T02:00:00.000Z"),
        isActive: true,
      },
      create: {
        id,
        growoutLocationId,
        targetConcentrationCellsPerMl,
        waterVolumeLiters,
        effectiveFrom: new Date("2026-04-07T02:00:00.000Z"),
        isActive: true,
      },
    });
  }

  const waterPrepPoints = [
    ["seed-water-prep-sedimentation-before", "Sedimentation Pond (Before)", "SEDIMENTATION_BEFORE", 1],
    ["seed-water-prep-sedimentation-after", "Sedimentation Pond (After)", "SEDIMENTATION_AFTER", 2],
    ["seed-water-prep-high-salinity", "High-Salinity Tank", "HIGH_SALINITY", 3],
    ["seed-water-prep-mixing", "Mixing Tank", "MIXING", 4],
    ["seed-water-prep-ready-1", "Ready Tank 1", "READY_1", 5],
    ["seed-water-prep-ready-2", "Ready Tank 2", "READY_2", 6],
  ] as const;

  for (const [id, name, code, sortOrder] of waterPrepPoints) {
    await prisma.waterPrepPoint.upsert({
      where: { id },
      update: { name, code, sortOrder },
      create: { id, name, code, sortOrder },
    });
  }

  await prisma.nurserySetting.upsert({
    where: { id: "seed-nursery-default" },
    update: {
      defaultDilutionVolumeLiters: 10,
      isActive: true,
    },
    create: {
      id: "seed-nursery-default",
      defaultDilutionVolumeLiters: 10,
      isActive: true,
    },
  });

  const telegramDestinations = [
    ["seed-telegram-daily-url", "Daily URL", TelegramRoomType.DAILY_URL, process.env.TELEGRAM_DAILY_URL_CHAT_ID],
    [
      "seed-telegram-entry-activity",
      "Entry Activity",
      TelegramRoomType.ENTRY_ACTIVITY,
      process.env.TELEGRAM_ENTRY_ACTIVITY_CHAT_ID,
    ],
    [
      "seed-telegram-daily-summary",
      "Daily Summary",
      TelegramRoomType.DAILY_SUMMARY,
      process.env.TELEGRAM_DAILY_SUMMARY_CHAT_ID,
    ],
  ] as const;

  for (const [id, name, roomType, chatId] of telegramDestinations) {
    await prisma.telegramDestination.upsert({
      where: { id },
      update: {
        name,
        roomType,
        chatId: chatId ?? `missing-${roomType.toLowerCase()}-chat-id`,
        isActive: Boolean(chatId),
      },
      create: {
        id,
        name,
        roomType,
        chatId: chatId ?? `missing-${roomType.toLowerCase()}-chat-id`,
        isActive: Boolean(chatId),
      },
    });
  }

  const sensors = [
    ["seed-sensor-water-temp", "Water Temperature", "WATER_TEMP", "°C", "อุณหภูมิน้ำ"],
    ["seed-sensor-ph", "pH", "PH", "pH", "ค่าความเป็นกรดด่าง"],
    ["seed-sensor-salinity", "Salinity", "SALINITY", "ppt", "ค่าความเค็ม"],
    ["seed-sensor-ammonia", "Ammonia", "AMMONIA", "mg/L", "ค่าแอมโมเนีย"],
    ["seed-sensor-nitrite", "Nitrite", "NITRITE", "mg/L", "ค่าไนไตรท์"],
    ["seed-sensor-do", "Dissolved Oxygen", "DISSOLVED_OXYGEN", "mg/L", "ค่าออกซิเจนละลายน้ำ"],
  ] as const;

  for (const [id, name, code, unit, description] of sensors) {
    await prisma.sensor.upsert({
      where: { id },
      update: {
        name,
        code,
        unit,
        description,
        isActive: true,
      },
      create: {
        id,
        name,
        code,
        unit,
        description,
        isActive: true,
      },
    });
  }

  const actuators = [
    ["seed-actuator-air-pump-1", "Air Pump 1", "AIR_PUMP_1", "ปั๊มลมหลัก"],
    ["seed-actuator-water-pump-1", "Water Pump 1", "WATER_PUMP_1", "ปั๊มน้ำหลัก"],
    ["seed-actuator-valve-1", "Valve 1", "VALVE_1", "วาล์วควบคุมชุดแรก"],
  ] as const;

  for (const [id, name, code, description] of actuators) {
    await prisma.actuator.upsert({
      where: { id },
      update: {
        name,
        code,
        description,
        isActive: true,
      },
      create: {
        id,
        name,
        code,
        description,
        isActive: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
