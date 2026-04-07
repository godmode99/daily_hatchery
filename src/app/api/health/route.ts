import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const requiredRuntimeConfig = ["DATABASE_URL", "NEXTAUTH_URL", "APP_BASE_URL", "DEFAULT_TIMEZONE"] as const;
  const missingRuntimeConfig = requiredRuntimeConfig.filter((key) => !process.env[key]);

  try {
    await getPrisma().$queryRaw`SELECT 1`;

    const status = missingRuntimeConfig.length > 0 ? "degraded" : "ok";

    return NextResponse.json(
      {
        status,
        database: "ok",
        missingRuntimeConfig,
        timezone: process.env.DEFAULT_TIMEZONE ?? null,
        checkedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
      },
      { status: status === "ok" ? 200 : 200 },
    );
  } catch (error) {
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "Database health check failed."
        : error instanceof Error
          ? error.message
          : "Unknown health check error";

    return NextResponse.json(
      {
        status: "error",
        database: "error",
        missingRuntimeConfig,
        timezone: process.env.DEFAULT_TIMEZONE ?? null,
        checkedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        error: errorMessage,
      },
      { status: 503 },
    );
  }
}
