import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db/prisma";
import { requireSensorIngest } from "@/lib/system/sensor-ingest-auth";

const readingSchema = z.object({
  sensorCode: z.string().trim().min(1),
  value: z.coerce.number().finite(),
  readingTime: z.string().datetime({ offset: true }).optional(),
  sourceDeviceId: z.string().trim().min(1).optional(),
  rawPayload: z.unknown().optional(),
});

const requestSchema = z.union([
  readingSchema,
  z.object({
    readings: z.array(readingSchema).min(1).max(100),
    sourceDeviceId: z.string().trim().min(1).optional(),
  }),
]);

type ReadingInput = z.infer<typeof readingSchema>;

export async function POST(request: Request) {
  const authError = requireSensorIngest(request);

  if (authError) {
    return authError;
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_PAYLOAD", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const readings = normalizeReadings(parsed.data);
  const sensorCodes = [...new Set(readings.map((reading) => reading.sensorCode))];
  const sensors = await getPrisma().sensor.findMany({
    where: { code: { in: sensorCodes }, isActive: true },
    select: { id: true, code: true },
  });
  const sensorIdByCode = new Map(sensors.map((sensor) => [sensor.code, sensor.id]));
  const unknownCodes = sensorCodes.filter((code) => !sensorIdByCode.has(code));

  if (unknownCodes.length > 0) {
    return NextResponse.json(
      { ok: false, error: "UNKNOWN_SENSOR_CODE", sensorCodes: unknownCodes },
      { status: 404 },
    );
  }

  await getPrisma().sensorReading.createMany({
    data: readings.map((reading) => ({
      sensorId: sensorIdByCode.get(reading.sensorCode) as string,
      readingValue: reading.value,
      readingTime: reading.readingTime ? new Date(reading.readingTime) : new Date(),
      sourceDeviceId: reading.sourceDeviceId ?? null,
      rawPayload: toInputJson(reading.rawPayload ?? body),
    })),
  });

  return NextResponse.json({ ok: true, inserted: readings.length });
}

function normalizeReadings(data: z.infer<typeof requestSchema>): ReadingInput[] {
  if ("readings" in data) {
    return data.readings.map((reading) => ({
      ...reading,
      sourceDeviceId: reading.sourceDeviceId ?? data.sourceDeviceId,
    }));
  }

  return [data];
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}
