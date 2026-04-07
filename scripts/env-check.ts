import "dotenv/config";

type EnvRule = {
  key: string;
  required: boolean;
  productionShouldNotStartWith?: string;
  placeholders?: string[];
};

const isProductionCheck = process.argv.includes("--production") || process.env.NODE_ENV === "production";
const rules: EnvRule[] = [
  {
    key: "DATABASE_URL",
    required: true,
    placeholders: ["postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"],
  },
  {
    key: "DIRECT_URL",
    required: true,
    placeholders: ["postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"],
  },
  {
    key: "NEXTAUTH_URL",
    required: true,
    productionShouldNotStartWith: "http://localhost",
  },
  {
    key: "NEXTAUTH_SECRET",
    required: true,
    placeholders: ["replace-with-random-secret"],
  },
  {
    key: "GOOGLE_CLIENT_ID",
    required: true,
    placeholders: ["replace-with-google-client-id"],
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    required: true,
    placeholders: ["replace-with-google-client-secret"],
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    required: true,
    placeholders: ["replace-with-telegram-bot-token"],
  },
  {
    key: "TELEGRAM_DAILY_URL_CHAT_ID",
    required: true,
    placeholders: ["replace-with-room-1-chat-id"],
  },
  {
    key: "TELEGRAM_ENTRY_ACTIVITY_CHAT_ID",
    required: true,
    placeholders: ["replace-with-room-2-chat-id"],
  },
  {
    key: "TELEGRAM_DAILY_SUMMARY_CHAT_ID",
    required: true,
    placeholders: ["replace-with-room-3-chat-id"],
  },
  {
    key: "APP_BASE_URL",
    required: true,
    productionShouldNotStartWith: "http://localhost",
  },
  { key: "DEFAULT_TIMEZONE", required: true },
  { key: "INITIAL_OWNER_EMAIL", required: true },
  {
    key: "CRON_SECRET",
    required: true,
    placeholders: ["replace-with-random-cron-secret"],
  },
  {
    key: "SENSOR_INGEST_SECRET",
    required: isProductionCheck,
    placeholders: ["replace-with-random-sensor-secret"],
  },
  {
    key: "ACTUATOR_DEVICE_SECRET",
    required: isProductionCheck,
    placeholders: ["replace-with-random-actuator-secret"],
  },
];

const results = rules.map((rule) => checkRule(rule));
const errors = results.filter((result) => result.level === "error");
const warnings = results.filter((result) => result.level === "warning");

console.log(`Environment check (${isProductionCheck ? "production" : "local"})`);

for (const result of results) {
  console.log(`${result.icon} ${result.key}: ${result.message}`);
}

console.log("");
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  process.exit(1);
}

function checkRule(rule: EnvRule) {
  const value = process.env[rule.key];

  if (!value) {
    return {
      key: rule.key,
      level: rule.required ? "error" : "warning",
      icon: rule.required ? "x" : "!",
      message: rule.required ? "missing" : "not set; local fallback may be used",
    } as const;
  }

  if (rule.placeholders?.includes(value)) {
    return {
      key: rule.key,
      level: rule.required ? "error" : "warning",
      icon: rule.required ? "x" : "!",
      message: "placeholder value",
    } as const;
  }

  if (isProductionCheck && rule.productionShouldNotStartWith && value.startsWith(rule.productionShouldNotStartWith)) {
    return {
      key: rule.key,
      level: "error",
      icon: "x",
      message: `must not use ${rule.productionShouldNotStartWith} in production`,
    } as const;
  }

  return {
    key: rule.key,
    level: "ok",
    icon: "-",
    message: `configured (${previewValue(value)})`,
  } as const;
}

function previewValue(value: string) {
  if (value.startsWith("postgresql://")) {
    return "postgresql://...";
  }

  if (value.startsWith("http")) {
    return value;
  }

  if (value.length <= 8) {
    return "set";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
