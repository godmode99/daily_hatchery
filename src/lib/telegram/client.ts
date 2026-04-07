import { TelegramRoomType, TelegramSendStatus } from "@prisma/client";
import { getPrisma } from "@/lib/db/prisma";

export async function sendTelegramMessage(input: {
  roomType: TelegramRoomType;
  messageType: string;
  payloadText: string;
  relatedTableName?: string;
  relatedRecordId?: string;
}) {
  const prisma = getPrisma();
  const destination = await prisma.telegramDestination.findFirst({
    where: {
      roomType: input.roomType,
      isActive: true,
    },
  });

  if (!destination) {
    return prisma.telegramMessageLog.create({
      data: {
        telegramDestinationId: await ensureFallbackDestination(input.roomType),
        messageType: input.messageType,
        relatedTableName: input.relatedTableName,
        relatedRecordId: input.relatedRecordId,
        payloadText: input.payloadText,
        sendStatus: TelegramSendStatus.FAILED,
        responsePayload: { error: "TELEGRAM_DESTINATION_NOT_CONFIGURED" },
      },
    });
  }

  const log = await prisma.telegramMessageLog.create({
    data: {
      telegramDestinationId: destination.id,
      messageType: input.messageType,
      relatedTableName: input.relatedTableName,
      relatedRecordId: input.relatedRecordId,
      payloadText: input.payloadText,
      sendStatus: TelegramSendStatus.PENDING,
    },
  });

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return prisma.telegramMessageLog.update({
      where: { id: log.id },
      data: {
        sendStatus: TelegramSendStatus.FAILED,
        responsePayload: { error: "TELEGRAM_BOT_TOKEN_NOT_CONFIGURED" },
      },
    });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: destination.chatId,
      text: input.payloadText,
    }),
  });

  const responsePayload = await response.json().catch(() => null);

  return prisma.telegramMessageLog.update({
    where: { id: log.id },
    data: {
      sendStatus: response.ok ? TelegramSendStatus.SENT : TelegramSendStatus.FAILED,
      responsePayload,
      sentAt: response.ok ? new Date() : null,
    },
  });
}

async function ensureFallbackDestination(roomType: TelegramRoomType) {
  const destination = await getPrisma().telegramDestination.upsert({
    where: { id: `fallback-${roomType.toLowerCase()}` },
    update: {},
    create: {
      id: `fallback-${roomType.toLowerCase()}`,
      name: `Fallback ${roomType}`,
      roomType,
      chatId: "missing-chat-id",
      isActive: false,
    },
  });

  return destination.id;
}
