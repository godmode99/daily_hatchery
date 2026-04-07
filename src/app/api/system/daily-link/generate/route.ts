import { NextResponse } from "next/server";
import { requireSystemCron } from "@/lib/system/cron-auth";
import { withSchedulerExecutionLog } from "@/lib/system/scheduler-log";
import { generateDailyLink } from "@/lib/worker/daily-link-generator";

export async function GET(request: Request) {
  const unauthorized = requireSystemCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  const { result: dailyLink, schedulerLogId } = await withSchedulerExecutionLog({
    jobName: "daily-link-generate",
    triggerContext: "api/system/daily-link/generate",
    run: generateDailyLink,
    details: (link) => `dailyLinkId=${link.id}; expiresAt=${link.expiresAt.toISOString()}`,
  });

  return NextResponse.json({
    ok: true,
    schedulerLogId,
    dailyLink: {
      id: dailyLink.id,
      token: dailyLink.token,
      startsAt: dailyLink.startsAt,
      expiresAt: dailyLink.expiresAt,
    },
  });
}

export const POST = GET;
