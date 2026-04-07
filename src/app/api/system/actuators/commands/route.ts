import { ExecutionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db/prisma";
import { requireActuatorDevice } from "@/lib/system/actuator-device-auth";

const updateCommandSchema = z.object({
  commandId: z.string().uuid(),
  executionStatus: z.enum(["EXECUTING", "SUCCESS", "FAILED", "CANCELLED"]),
  responsePayload: z.unknown().optional(),
});

export async function GET(request: Request) {
  const authError = requireActuatorDevice(request);

  if (authError) {
    return authError;
  }

  const url = new URL(request.url);
  const actuatorCode = url.searchParams.get("actuatorCode")?.trim() || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 100);
  const commands = await getPrisma().actuatorCommand.findMany({
    where: {
      executionStatus: "PENDING",
      actuator: {
        isActive: true,
        ...(actuatorCode ? { code: actuatorCode } : {}),
      },
    },
    include: { actuator: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return NextResponse.json({
    ok: true,
    commands: commands.map((command) => ({
      id: command.id,
      actuatorCode: command.actuator.code,
      actuatorName: command.actuator.name,
      commandType: command.commandType,
      commandSource: command.commandSource,
      createdAt: command.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  const authError = requireActuatorDevice(request);

  if (authError) {
    return authError;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCommandSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_PAYLOAD", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const executionStatus = parsed.data.executionStatus as ExecutionStatus;
  const shouldSetExecutedAt = ["SUCCESS", "FAILED", "CANCELLED"].includes(executionStatus);
  const command = await getPrisma().actuatorCommand.update({
    where: { id: parsed.data.commandId },
    data: {
      executionStatus,
      executedAt: shouldSetExecutedAt ? new Date() : undefined,
      responsePayload: parsed.data.responsePayload ? JSON.parse(JSON.stringify(parsed.data.responsePayload)) : undefined,
    },
    include: { actuator: true },
  });

  return NextResponse.json({
    ok: true,
    command: {
      id: command.id,
      actuatorCode: command.actuator.code,
      commandType: command.commandType,
      executionStatus: command.executionStatus,
    },
  });
}
