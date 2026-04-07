import { TelegramRoomType } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildDailySummaryMessage } from "@/lib/reports/daily-summary";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { requireSystemCron } from "@/lib/system/cron-auth";
import { withSchedulerExecutionLog } from "@/lib/system/scheduler-log";

export async function GET(request: Request) {
  const unauthorized = requireSystemCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  const { result: log, schedulerLogId } = await withSchedulerExecutionLog({
    jobName: "daily-summary-send",
    triggerContext: "api/system/summary/send",
    run: async () => {
      const message = await buildDailySummaryMessage();

      return sendTelegramMessage({
        roomType: TelegramRoomType.DAILY_SUMMARY,
        messageType: "DAILY_SUMMARY",
        payloadText: message,
      });
    },
    details: (telegramLog) => `telegramLogId=${telegramLog.id}; sendStatus=${telegramLog.sendStatus}`,
  });

  return NextResponse.json({
    ok: log.sendStatus === "SENT",
    schedulerLogId,
    logId: log.id,
    sendStatus: log.sendStatus,
  });
}

export const POST = GET;
