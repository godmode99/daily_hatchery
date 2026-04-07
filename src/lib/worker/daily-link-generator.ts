import { randomBytes } from "crypto";
import { DailyLinkStatus, TelegramRoomType } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { formatDailyUrlMessage } from "@/lib/telegram/formatters";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { getCurrentBangkokOperationalWindow } from "@/lib/time/bangkok";

export async function generateDailyLink(options: { forceNew?: boolean } = {}) {
  const prisma = getPrisma();
  const window = getCurrentBangkokOperationalWindow();

  if (!options.forceNew) {
    const existing = await prisma.dailyLink.findFirst({
      where: {
        status: DailyLinkStatus.ACTIVE,
        startsAt: window.startsAt,
        expiresAt: window.expiresAt,
      },
    });

    if (existing) {
      return existing;
    }
  }

  const token = randomBytes(18).toString("base64url");

  const dailyLink = await prisma.$transaction(async (tx) => {
    await tx.dailyLink.updateMany({
      where: { status: DailyLinkStatus.ACTIVE },
      data: { status: DailyLinkStatus.EXPIRED },
    });

    return tx.dailyLink.create({
      data: {
        token,
        startsAt: window.startsAt,
        expiresAt: window.expiresAt,
        status: DailyLinkStatus.ACTIVE,
      },
    });
  });

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/entry/${dailyLink.token}`;

  const log = await sendTelegramMessage({
    roomType: TelegramRoomType.DAILY_URL,
    messageType: "DAILY_URL",
    relatedTableName: "daily_links",
    relatedRecordId: dailyLink.id,
    payloadText: formatDailyUrlMessage({
      url,
      expiresAt: dailyLink.expiresAt,
    }),
  });

  if (log.sendStatus === "SENT") {
    await prisma.dailyLink.update({
      where: { id: dailyLink.id },
      data: { telegramSentAt: log.sentAt },
    });
  }

  return dailyLink;
}
