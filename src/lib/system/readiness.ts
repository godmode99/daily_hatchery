import { getPrisma } from "@/lib/db/prisma";

type EnvCheck = {
  key: string;
  label: string;
  isConfigured: boolean;
  note: string;
};

const placeholderByKey: Record<string, string[]> = {
  DATABASE_URL: ["postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"],
  DIRECT_URL: ["postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"],
  NEXTAUTH_URL: ["http://localhost:3000"],
  NEXTAUTH_SECRET: ["replace-with-random-secret"],
  GOOGLE_CLIENT_ID: ["replace-with-google-client-id"],
  GOOGLE_CLIENT_SECRET: ["replace-with-google-client-secret"],
  TELEGRAM_BOT_TOKEN: ["replace-with-telegram-bot-token"],
  TELEGRAM_DAILY_URL_CHAT_ID: ["replace-with-room-1-chat-id"],
  TELEGRAM_ENTRY_ACTIVITY_CHAT_ID: ["replace-with-room-2-chat-id"],
  TELEGRAM_DAILY_SUMMARY_CHAT_ID: ["replace-with-room-3-chat-id"],
  APP_BASE_URL: ["http://localhost:3000"],
  DEFAULT_TIMEZONE: [],
  INITIAL_OWNER_EMAIL: [],
  CRON_SECRET: ["replace-with-random-cron-secret"],
  SENSOR_INGEST_SECRET: ["replace-with-random-sensor-secret"],
  ACTUATOR_DEVICE_SECRET: ["replace-with-random-actuator-secret"],
};

const requiredEnvKeys = [
  ["DATABASE_URL", "Neon pooled connection"],
  ["DIRECT_URL", "Neon direct connection"],
  ["NEXTAUTH_URL", "Auth callback base URL"],
  ["NEXTAUTH_SECRET", "Auth session secret"],
  ["GOOGLE_CLIENT_ID", "Google OAuth client ID"],
  ["GOOGLE_CLIENT_SECRET", "Google OAuth client secret"],
  ["TELEGRAM_BOT_TOKEN", "Telegram bot token"],
  ["TELEGRAM_DAILY_URL_CHAT_ID", "Daily URL room"],
  ["TELEGRAM_ENTRY_ACTIVITY_CHAT_ID", "Entry activity room"],
  ["TELEGRAM_DAILY_SUMMARY_CHAT_ID", "Daily summary room"],
  ["APP_BASE_URL", "Public app base URL"],
  ["DEFAULT_TIMEZONE", "Default timezone"],
  ["INITIAL_OWNER_EMAIL", "Initial owner email"],
  ["CRON_SECRET", "Vercel Cron bearer secret"],
  ["SENSOR_INGEST_SECRET", "Sensor ingest bearer secret"],
  ["ACTUATOR_DEVICE_SECRET", "Actuator device bearer secret"],
] as const;

export async function getSystemReadiness() {
  const prisma = getPrisma();
  const [
    approvedAdmins,
    pendingAdmins,
    people,
    workerKeys,
    activeDailyLinks,
    telegramDestinations,
    sensors,
    sensorReadings,
    actuators,
    pendingActuatorCommands,
    automationRules,
    exportJobs,
  ] = await Promise.all([
    prisma.adminAccount.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.adminAccount.count({ where: { approvalStatus: "PENDING" } }),
    prisma.person.count(),
    prisma.workerKey.count({ where: { status: "ACTIVE" } }),
    prisma.dailyLink.count({ where: { status: "ACTIVE" } }),
    prisma.telegramDestination.findMany({ orderBy: { roomType: "asc" } }),
    prisma.sensor.count({ where: { isActive: true } }),
    prisma.sensorReading.count(),
    prisma.actuator.count({ where: { isActive: true } }),
    prisma.actuatorCommand.count({ where: { executionStatus: "PENDING" } }),
    prisma.automationRule.count({ where: { isActive: true } }),
    prisma.exportJob.count(),
  ]);

  const envChecks = requiredEnvKeys.map(([key, label]): EnvCheck => {
    const value = process.env[key];
    const placeholders = placeholderByKey[key] ?? [];
    const isConfigured = Boolean(value) && !placeholders.includes(value as string);

    return {
      key,
      label,
      isConfigured,
      note: buildEnvNote(key, value, isConfigured),
    };
  });

  return {
    envChecks,
    databaseChecks: [
      { label: "Approved admins", value: approvedAdmins },
      { label: "Pending admins", value: pendingAdmins },
      { label: "People", value: people },
      { label: "Active worker keys", value: workerKeys },
      { label: "Active daily links", value: activeDailyLinks },
      { label: "Active sensors", value: sensors },
      { label: "Sensor readings", value: sensorReadings },
      { label: "Active actuators", value: actuators },
      { label: "Pending actuator commands", value: pendingActuatorCommands },
      { label: "Active automation rules", value: automationRules },
      { label: "Export jobs", value: exportJobs },
    ],
    telegramDestinations: telegramDestinations.map((destination) => ({
      name: destination.name,
      roomType: destination.roomType,
      isActive: destination.isActive,
      chatIdPreview: previewValue(destination.chatId),
    })),
    productionWarnings: buildProductionWarnings(envChecks),
  };
}

function buildEnvNote(key: string, value: string | undefined, isConfigured: boolean) {
  if (!isConfigured) {
    return "missing or placeholder";
  }

  if (["NEXTAUTH_URL", "APP_BASE_URL"].includes(key) && value?.startsWith("http://localhost")) {
    return "local URL, update on Vercel production";
  }

  if (["SENSOR_INGEST_SECRET", "ACTUATOR_DEVICE_SECRET"].includes(key)) {
    return "configured";
  }

  return `configured (${previewValue(value)})`;
}

function buildProductionWarnings(envChecks: EnvCheck[]) {
  const warnings: string[] = [];
  const byKey = new Map(envChecks.map((check) => [check.key, check]));

  if (process.env.NEXTAUTH_URL?.startsWith("http://localhost")) {
    warnings.push("NEXTAUTH_URL ยังเป็น localhost ต้องเปลี่ยนเป็น Vercel domain ตอน production");
  }

  if (process.env.APP_BASE_URL?.startsWith("http://localhost")) {
    warnings.push("APP_BASE_URL ยังเป็น localhost ต้องเปลี่ยนเป็น Vercel domain ตอน production");
  }

  for (const key of ["SENSOR_INGEST_SECRET", "ACTUATOR_DEVICE_SECRET"]) {
    if (!byKey.get(key)?.isConfigured) {
      warnings.push(`${key} ยังไม่ตั้งค่าแยก ตอนนี้ endpoint อาจพึ่ง fallback secret สำหรับทดสอบ local`);
    }
  }

  return warnings;
}

function previewValue(value: string | undefined) {
  if (!value) {
    return "-";
  }

  if (value.length <= 8) {
    return "set";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
