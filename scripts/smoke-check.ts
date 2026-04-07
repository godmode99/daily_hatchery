import "dotenv/config";

type SmokeTarget = {
  name: string;
  path: string;
  expectedStatus: number;
  parseJson?: boolean;
};

const baseUrl = normalizeBaseUrl(process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000");
const targets: SmokeTarget[] = [
  { name: "Home", path: "/", expectedStatus: 200 },
  { name: "Showcase", path: "/showcase", expectedStatus: 200 },
  { name: "Health", path: "/api/health", expectedStatus: 200, parseJson: true },
];

const results = [];

for (const target of targets) {
  const startedAt = Date.now();
  const url = `${baseUrl}${target.path}`;

  try {
    const response = await fetch(url, { redirect: "manual" });
    const body = target.parseJson ? await response.json().catch(() => null) : null;
    const ok = response.status === target.expectedStatus;

    results.push({
      name: target.name,
      path: target.path,
      ok,
      status: response.status,
      expectedStatus: target.expectedStatus,
      responseTimeMs: Date.now() - startedAt,
      ...(body ? { body } : {}),
    });
  } catch (error) {
    results.push({
      name: target.name,
      path: target.path,
      ok: false,
      status: "FETCH_ERROR",
      expectedStatus: target.expectedStatus,
      responseTimeMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    });
  }
}

const ok = results.every((result) => result.ok);

console.log(JSON.stringify({ ok, baseUrl, results }, null, 2));

if (!ok) {
  process.exit(1);
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}
