import Link from "next/link";
import { redirect } from "next/navigation";
import { validateDailyLink } from "@/lib/worker/daily-link";
import { formatBangkokDateTime } from "@/lib/time/bangkok";

type EntryTokenPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
};

export default async function EntryTokenPage({ params }: EntryTokenPageProps) {
  const { dailyToken } = await params;
  const result = await validateDailyLink(dailyToken);

  if (!result.ok) {
    redirect(`/entry/${dailyToken}/expired`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <p className="text-sm font-medium text-accent">Worker Entry</p>
      <h1 className="mt-2 text-3xl font-semibold">ยืนยันคีย์พนักงาน</h1>
      <p className="mt-3 text-muted">
        ลิงก์นี้ใช้ได้ถึง {formatBangkokDateTime(result.dailyLink.expiresAt)}
      </p>
      <Link
        href={`/entry/${dailyToken}/verify`}
        className="mt-6 inline-flex w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        ไปหน้ายืนยันคีย์
      </Link>
    </main>
  );
}
