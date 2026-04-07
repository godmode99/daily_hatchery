import { DataMode } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { getPrisma } from "@/lib/db/prisma";
import { getAdminAccessState } from "@/lib/permissions/admin";
import { getAdminOperationalReport } from "@/lib/reports/admin-operational";
import { buildOperationalExcelXml } from "@/lib/reports/excel";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const accessState = await getAdminAccessState({
    email: session?.user?.email,
    displayName: session?.user?.name,
  });

  if (accessState.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = url.searchParams.get("dateTo") ?? undefined;
  const dataMode = url.searchParams.get("dataMode") === "DEMO" ? DataMode.DEMO : DataMode.REAL;
  const includeDeleted = url.searchParams.get("includeDeleted") === "true";
  const report = await getAdminOperationalReport({
    dateFrom,
    dateTo,
    dataMode,
    includeDeleted,
  });
  const workbook = buildOperationalExcelXml(report);

  await getPrisma().exportJob.create({
    data: {
      requestedByAdminAccountId: accessState.adminAccount.id,
      exportType: "EXCEL",
      reportType: dateFrom && dateTo && dateFrom !== dateTo ? "CUSTOM" : "DAILY",
      dataModeFilter: dataMode,
      includeDeleted,
      dateFrom: report.filters.dateFrom,
      dateTo: report.filters.dateTo,
      filePath: null,
      jobStatus: "COMPLETED",
      completedAt: new Date(),
    },
  });

  const filename = `daily-hatchery-${dataMode.toLowerCase()}-${dateFrom ?? "today"}-${dateTo ?? "today"}.xls`;

  return new Response(workbook, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
