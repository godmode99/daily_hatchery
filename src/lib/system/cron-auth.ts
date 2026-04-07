import { NextResponse } from "next/server";

export function requireSystemCron(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.SYSTEM_CRON_SECRET;

  if (!secret || secret === "replace-with-random-cron-secret") {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;

  if (authorization !== expected) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  return null;
}
