import "dotenv/config";

const baseUrl = normalizeBaseUrl(process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000");
const token = process.env.SENSOR_INGEST_SECRET ?? process.env.CRON_SECRET;

if (!token) {
  throw new Error("SENSOR_INGEST_SECRET or CRON_SECRET is required.");
}

const payload = {
  sourceDeviceId: process.env.DEVICE_DEMO_ID ?? "local-sensor-demo",
  readings: [
    { sensorCode: "WATER_TEMP", value: randomBetween(27.6, 29.4) },
    { sensorCode: "PH", value: randomBetween(7.8, 8.3) },
    { sensorCode: "SALINITY", value: randomBetween(28, 32) },
    { sensorCode: "AMMONIA", value: randomBetween(0.02, 0.12) },
    { sensorCode: "NITRITE", value: randomBetween(0.01, 0.08) },
    { sensorCode: "DISSOLVED_OXYGEN", value: randomBetween(5.8, 7.2) },
  ],
};

const response = await fetch(`${baseUrl}/api/system/sensors/readings`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const body = await response.json().catch(() => null);
console.log(JSON.stringify({ status: response.status, body }, null, 2));

function randomBetween(min: number, max: number) {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}
