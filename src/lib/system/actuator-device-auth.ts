import { NextResponse } from "next/server";

export function requireActuatorDevice(request: Request) {
  const secret =
    process.env.ACTUATOR_DEVICE_SECRET ??
    process.env.SENSOR_INGEST_SECRET ??
    process.env.CRON_SECRET;

  if (
    !secret ||
    secret === "replace-with-random-actuator-secret" ||
    secret === "replace-with-random-sensor-secret" ||
    secret === "replace-with-random-cron-secret"
  ) {
    return NextResponse.json(
      { ok: false, error: "ACTUATOR_DEVICE_SECRET_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;

  if (authorization !== expected) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  return null;
}
