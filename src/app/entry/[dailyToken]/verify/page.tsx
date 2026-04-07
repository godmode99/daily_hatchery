import { redirect } from "next/navigation";
import { verifyWorkerKeyAction } from "@/app/entry/[dailyToken]/actions";
import { validateDailyLink } from "@/lib/worker/daily-link";

type VerifyPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { dailyToken } = await params;
  const { error } = await searchParams;
  const result = await validateDailyLink(dailyToken);

  if (!result.ok) {
    redirect(`/entry/${dailyToken}/expired`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-medium text-accent">Worker Verification</p>
      <h1 className="mt-2 text-3xl font-semibold">ใส่คีย์ส่วนตัว</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          คีย์ไม่ถูกต้องหรือลิงก์หมดอายุแล้ว
        </p>
      ) : null}
      <form action={verifyWorkerKeyAction} className="mt-6 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <label className="block text-sm font-medium" htmlFor="worker-key">
          คีย์พนักงาน
        </label>
        <input
          id="worker-key"
          name="key"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
          placeholder="กรอกคีย์"
          required
        />
        <button
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          type="submit"
        >
          ยืนยัน
        </button>
      </form>
    </main>
  );
}
