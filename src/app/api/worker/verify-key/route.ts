import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientMetadata } from "@/lib/http/client-metadata";
import { verifyWorkerKey } from "@/lib/worker/daily-link";

const verifyWorkerKeySchema = z.object({
  token: z.string().min(1),
  key: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const payload = verifyWorkerKeySchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const result = await verifyWorkerKey({
    ...payload.data,
    metadata: getClientMetadata(request.headers),
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === "TOO_MANY_ATTEMPTS" ? 429 : 401 });
  }

  return NextResponse.json({
    ok: true,
    person: {
      id: result.person.id,
      displayName: result.person.displayName,
    },
    workerKeyId: result.workerKey.id,
    dailyLinkId: result.dailyLink.id,
  });
}
