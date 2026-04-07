import { DailyLinkStatus, KeyStatus } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";

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

export async function verifyWorkerKey(input: { token: string; key: string }) {
  const prisma = getPrisma();
  const linkResult = await validateDailyLink(input.token);

  if (!linkResult.ok) {
    if (linkResult.dailyLink) {
      await prisma.workerAccessLog.create({
        data: {
          dailyLinkId: linkResult.dailyLink.id,
          actionType: linkResult.error === "LINK_EXPIRED" ? "EXPIRED_LINK_ACCESS" : "VERIFY_FAIL",
        },
      });
    }

    return linkResult;
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
    },
  });

  return {
    ok: true as const,
    dailyLink: linkResult.dailyLink,
    workerKey,
    person: workerKey.person,
  };
}
