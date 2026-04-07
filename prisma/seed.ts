import "dotenv/config";
import { AdminRole, ApprovalStatus, DataMode, DefaultRole, TelegramRoomType } from "@prisma/client";
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

  await seedDemoOperationalData();
}

async function seedDemoOperationalData() {
  const demoPerson = await prisma.person.upsert({
    where: { id: "seed-demo-worker-person" },
    update: {
      displayName: "Demo Worker",
      defaultRole: DefaultRole.WORKER,
      isActive: true,
    },
    create: {
      id: "seed-demo-worker-person",
      displayName: "Demo Worker",
      defaultRole: DefaultRole.WORKER,
      isActive: true,
    },
  });

  const demoWorkerKey = await prisma.workerKey.upsert({
    where: { id: "seed-demo-worker-key" },
    update: {
      personId: demoPerson.id,
      keyValue: "demo-1234",
      keyMasked: "de****34",
      status: "ACTIVE",
    },
    create: {
      id: "seed-demo-worker-key",
      personId: demoPerson.id,
      keyValue: "demo-1234",
      keyMasked: "de****34",
      status: "ACTIVE",
    },
  });

  const now = new Date();
  const todayStart = startOfBangkokDay(now);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const demoDailyLink = await prisma.dailyLink.upsert({
    where: { id: "seed-demo-daily-link" },
    update: {
      token: "demo-daily-link",
      startsAt: todayStart,
      expiresAt: tomorrowStart,
      status: "ACTIVE",
      createdBySystem: true,
    },
    create: {
      id: "seed-demo-daily-link",
      token: "demo-daily-link",
      startsAt: todayStart,
      expiresAt: tomorrowStart,
      status: "ACTIVE",
      createdBySystem: true,
    },
  });

  await prisma.foodEntry.deleteMany({ where: { id: { in: ["seed-demo-food-1", "seed-demo-food-2"] } } });
  await prisma.growoutEntry.deleteMany({ where: { id: { in: ["seed-demo-growout-1", "seed-demo-growout-2"] } } });
  await prisma.nurseryEntry.deleteMany({ where: { id: { in: ["seed-demo-nursery-1"] } } });
  await prisma.waterPrepEntry.deleteMany({ where: { id: { in: ["seed-demo-water-prep-1"] } } });

  await prisma.foodEntry.create({
    data: {
      id: "seed-demo-food-1",
      dataMode: DataMode.DEMO,
      dailyLinkId: demoDailyLink.id,
      planktonTypeId: "seed-plankton-isochrysis",
      measuredConcentrationCellsPerMl: 650000,
      createdByUserId: demoPerson.id,
      createdByWorkerKeyId: demoWorkerKey.id,
      createdAt: now,
      destinations: {
        create: [
          {
            growoutLocationId: "seed-growout-condo-1",
            targetConcentrationCellsPerMl: 100000,
            waterVolumeLiters: 1000,
            requiredDosingVolumeLiters: 153.85,
          },
          {
            growoutLocationId: "seed-growout-condo-2",
            targetConcentrationCellsPerMl: 100000,
            waterVolumeLiters: 1000,
            requiredDosingVolumeLiters: 153.85,
          },
        ],
      },
    },
  });

  await prisma.foodEntry.create({
    data: {
      id: "seed-demo-food-2",
      dataMode: DataMode.DEMO,
      dailyLinkId: demoDailyLink.id,
      planktonTypeId: "seed-plankton-chaetoceros",
      measuredConcentrationCellsPerMl: 820000,
      createdByUserId: demoPerson.id,
      createdByWorkerKeyId: demoWorkerKey.id,
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      destinations: {
        create: [
          {
            growoutLocationId: "seed-growout-upwelling",
            targetConcentrationCellsPerMl: 100000,
            waterVolumeLiters: 500,
            requiredDosingVolumeLiters: 60.98,
          },
        ],
      },
    },
  });

  await prisma.growoutEntry.createMany({
    data: [
      {
        id: "seed-demo-growout-1",
        dataMode: DataMode.DEMO,
        dailyLinkId: demoDailyLink.id,
        growoutLocationId: "seed-growout-condo-1",
        deadCount: 14,
        ph: 8.1,
        ammonia: 0.05,
        nitrite: 0.02,
        alkaline: 135,
        salinity: 28,
        createdByUserId: demoPerson.id,
        createdByWorkerKeyId: demoWorkerKey.id,
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      },
      {
        id: "seed-demo-growout-2",
        dataMode: DataMode.DEMO,
        dailyLinkId: demoDailyLink.id,
        growoutLocationId: "seed-growout-condo-2",
        deadCount: 9,
        ph: 8.0,
        ammonia: 0.04,
        nitrite: 0.01,
        alkaline: 132,
        salinity: 29,
        createdByUserId: demoPerson.id,
        createdByWorkerKeyId: demoWorkerKey.id,
        createdAt: new Date(now.getTime() - 35 * 60 * 1000),
      },
    ],
  });

  await prisma.nurseryEntry.create({
    data: {
      id: "seed-demo-nursery-1",
      dataMode: DataMode.DEMO,
      dailyLinkId: demoDailyLink.id,
      dilutionWaterVolumeLiters: 10,
      averageCount: 126,
      totalCells: 1260,
      densityCellsPerMl: 126,
      ph: 8.2,
      ammonia: 0.03,
      nitrite: 0.01,
      alkaline: 140,
      salinity: 27,
      createdByUserId: demoPerson.id,
      createdByWorkerKeyId: demoWorkerKey.id,
      createdAt: new Date(now.getTime() - 25 * 60 * 1000),
      counts: {
        create: [
          { rowNo: 1, countValue: 122 },
          { rowNo: 2, countValue: 128 },
          { rowNo: 3, countValue: 126 },
          { rowNo: 4, countValue: 130 },
          { rowNo: 5, countValue: 124 },
        ],
      },
    },
  });

  await prisma.waterPrepEntry.create({
    data: {
      id: "seed-demo-water-prep-1",
      dataMode: DataMode.DEMO,
      dailyLinkId: demoDailyLink.id,
      waterPrepPointId: "seed-water-prep-ready-1",
      preparedVolumeTons: 12.5,
      salinity: 28,
      ph: 8.1,
      ammonia: 0.02,
      nitrite: 0.01,
      alkaline: 136,
      createdByUserId: demoPerson.id,
      createdByWorkerKeyId: demoWorkerKey.id,
      createdAt: new Date(now.getTime() - 20 * 60 * 1000),
    },
  });
}

function startOfBangkokDay(now = new Date()) {
  const bangkok = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  return new Date(Date.UTC(bangkok.getUTCFullYear(), bangkok.getUTCMonth(), bangkok.getUTCDate()) - 7 * 60 * 60 * 1000);
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
