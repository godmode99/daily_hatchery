import { DailyLinkStatus, KeyStatus } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import type { ClientMetadata } from "@/lib/http/client-metadata";

const VERIFY_FAIL_WINDOW_MS = 10 * 60 * 1000;
const VERIFY_FAIL_LIMIT_PER_IP = 8;

export async function validateDailyLink(token: string) {
  const dailyLink = await getPrisma().dailyLink.findUnique({
    where: { token },
  });

  if (!dailyLink) {
    return { ok: false as const, error: "LINK_NOT_FOUND" as const };
  }

  if (dailyLink.status !== DailyLinkStatus.ACTIVE || dailyLink.expiresAt <= new Date()) {
    return { ok: false as const, error: "LINK_EXPIRED" as const, dailyLink };
  }

  return { ok: true as const, dailyLink };
}

export async function verifyWorkerKey(input: { token: string; key: string; metadata?: ClientMetadata }) {
  const prisma = getPrisma();
  const linkResult = await validateDailyLink(input.token);

  if (!linkResult.ok) {
    if (linkResult.dailyLink) {
      await prisma.workerAccessLog.create({
        data: {
          dailyLinkId: linkResult.dailyLink.id,
          actionType: linkResult.error === "LINK_EXPIRED" ? "EXPIRED_LINK_ACCESS" : "VERIFY_FAIL",
          ipAddress: input.metadata?.ipAddress,
          userAgent: input.metadata?.userAgent,
        },
      });
    }

    return linkResult;
  }

  const failedAttempts = await prisma.workerAccessLog.count({
    where: {
      dailyLinkId: linkResult.dailyLink.id,
      actionType: "VERIFY_FAIL",
      createdAt: { gte: new Date(Date.now() - VERIFY_FAIL_WINDOW_MS) },
      ...(input.metadata?.ipAddress ? { ipAddress: input.metadata.ipAddress } : {}),
    },
  });

  if (failedAttempts >= VERIFY_FAIL_LIMIT_PER_IP) {
    await prisma.workerAccessLog.create({
      data: {
        dailyLinkId: linkResult.dailyLink.id,
        actionType: "VERIFY_FAIL",
        ipAddress: input.metadata?.ipAddress,
        userAgent: input.metadata?.userAgent,
      },
    });

    return { ok: false as const, error: "TOO_MANY_ATTEMPTS" as const };
  }

  const workerKey = await prisma.workerKey.findUnique({
    where: { keyValue: input.key.trim() },
    include: { person: true },
  });

  if (!workerKey || workerKey.status !== KeyStatus.ACTIVE || !workerKey.person.isActive) {
    await prisma.workerAccessLog.create({
      data: {
        dailyLinkId: linkResult.dailyLink.id,
        workerKeyId: workerKey?.id,
        personId: workerKey?.personId,
        actionType: "VERIFY_FAIL",
        ipAddress: input.metadata?.ipAddress,
        userAgent: input.metadata?.userAgent,
      },
    });

    return { ok: false as const, error: "INVALID_KEY" as const };
  }

  await prisma.workerAccessLog.create({
    data: {
      dailyLinkId: linkResult.dailyLink.id,
      workerKeyId: workerKey.id,
      personId: workerKey.personId,
      actionType: "VERIFY_SUCCESS",
      ipAddress: input.metadata?.ipAddress,
      userAgent: input.metadata?.userAgent,
    },
  });

  return {
    ok: true as const,
    dailyLink: linkResult.dailyLink,
    workerKey,
    person: workerKey.person,
  };
}
