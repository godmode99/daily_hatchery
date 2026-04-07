import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db/prisma";

const workerSessionCookie = "daily_hatchery_worker";

export async function setWorkerVerificationCookie(input: {
  dailyLinkId: string;
  workerKeyId: string;
  personId: string;
  expiresAt: Date;
}) {
  const payload = [
    input.dailyLinkId,
    input.workerKeyId,
    input.personId,
    input.expiresAt.getTime().toString(),
  ].join(".");

  const cookieStore = await cookies();
  cookieStore.set(workerSessionCookie, `${payload}.${signPayload(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: input.expiresAt,
    path: "/",
  });
}

export async function getVerifiedWorkerForToken(token: string) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(workerSessionCookie)?.value;

  if (!cookie) {
    return { ok: false as const, error: "MISSING_WORKER_SESSION" as const };
  }

  const parts = cookie.split(".");
  if (parts.length !== 5) {
    return { ok: false as const, error: "INVALID_WORKER_SESSION" as const };
  }

  const [dailyLinkId, workerKeyId, personId, expiresAtRaw, signature] = parts;
  const payload = [dailyLinkId, workerKeyId, personId, expiresAtRaw].join(".");

  if (!isValidSignature(payload, signature)) {
    return { ok: false as const, error: "INVALID_WORKER_SESSION" as const };
  }

  const expiresAt = new Date(Number(expiresAtRaw));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return { ok: false as const, error: "EXPIRED_WORKER_SESSION" as const };
  }

  const dailyLink = await getPrisma().dailyLink.findUnique({
    where: { id: dailyLinkId },
  });

  if (!dailyLink || dailyLink.token !== token || dailyLink.expiresAt <= new Date()) {
    return { ok: false as const, error: "LINK_EXPIRED" as const };
  }

  const workerKey = await getPrisma().workerKey.findUnique({
    where: { id: workerKeyId },
    include: { person: true },
  });

  if (!workerKey || workerKey.personId !== personId || workerKey.status !== "ACTIVE") {
    return { ok: false as const, error: "INVALID_KEY" as const };
  }

  return {
    ok: true as const,
    dailyLink,
    workerKey,
    person: workerKey.person,
  };
}

function signPayload(payload: string) {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "dev-secret")
    .update(payload)
    .digest("base64url");
}

function isValidSignature(payload: string, signature: string) {
  const expected = signPayload(payload);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
