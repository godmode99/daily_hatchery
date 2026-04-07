import { NextResponse } from "next/server";
import { validateDailyLink } from "@/lib/worker/daily-link";

type ValidateDailyLinkRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, { params }: ValidateDailyLinkRouteProps) {
  const { token } = await params;
  const result = await validateDailyLink(token);

  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === "LINK_NOT_FOUND" ? 404 : 410 });
  }

  return NextResponse.json({
    ok: true,
    status: result.dailyLink.status,
    dailyLink: {
      token: result.dailyLink.token,
      startsAt: result.dailyLink.startsAt,
      expiresAt: result.dailyLink.expiresAt,
    },
  });
}
