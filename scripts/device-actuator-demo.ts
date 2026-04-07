import "dotenv/config";

type PendingCommand = {
  id: string;
  actuatorCode: string;
  actuatorName: string;
  commandType: string;
};

const baseUrl = normalizeBaseUrl(process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000");
const token = process.env.ACTUATOR_DEVICE_SECRET ?? process.env.SENSOR_INGEST_SECRET ?? process.env.CRON_SECRET;
const actuatorCode = process.env.ACTUATOR_DEMO_CODE;

if (!token) {
  throw new Error("ACTUATOR_DEVICE_SECRET, SENSOR_INGEST_SECRET, or CRON_SECRET is required.");
}

const commandsUrl = new URL(`${baseUrl}/api/system/actuators/commands`);

if (actuatorCode) {
  commandsUrl.searchParams.set("actuatorCode", actuatorCode);
}

commandsUrl.searchParams.set("limit", process.env.ACTUATOR_DEMO_LIMIT ?? "10");

const response = await fetch(commandsUrl, {
  headers: { Authorization: `Bearer ${token}` },
});
const body = await response.json().catch(() => null);

if (!response.ok || !body?.ok) {
  console.log(JSON.stringify({ status: response.status, body }, null, 2));
  process.exit(1);
}

const commands = (body.commands ?? []) as PendingCommand[];

if (commands.length === 0) {
  console.log(JSON.stringify({ ok: true, message: "No pending actuator commands." }, null, 2));
  process.exit(0);
}

const results = [];

for (const command of commands) {
  await updateCommand(command.id, "EXECUTING", {
    actuatorCode: command.actuatorCode,
    actuatorName: command.actuatorName,
    message: "Demo controller accepted command.",
  });

  const result = await updateCommand(command.id, "SUCCESS", {
    actuatorCode: command.actuatorCode,
    actuatorName: command.actuatorName,
    commandType: command.commandType,
    message: "Demo controller completed command.",
  });
  results.push(result);
}

console.log(JSON.stringify({ ok: true, processed: results.length, results }, null, 2));

async function updateCommand(commandId: string, executionStatus: "EXECUTING" | "SUCCESS", responsePayload: unknown) {
  const updateResponse = await fetch(`${baseUrl}/api/system/actuators/commands`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commandId, executionStatus, responsePayload }),
  });

  return updateResponse.json().catch(() => ({ ok: false, status: updateResponse.status }));
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}
