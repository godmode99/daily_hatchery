import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getWorkerMessages } from "@/lib/i18n/server";
import { formatBangkokDateTime } from "@/lib/time/bangkok";
import { validateDailyLink } from "@/lib/worker/daily-link";

type EntryTokenPageProps = {
  params: Promise<{
    dailyToken: string;
  }>;
};

export default async function EntryTokenPage({ params }: EntryTokenPageProps) {
  const { dailyToken } = await params;
  const { locale, messages } = await getWorkerMessages();
  const result = await validateDailyLink(dailyToken);

  if (!result.ok) {
    redirect(`/entry/${dailyToken}/expired`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <LanguageSwitcher currentLocale={locale} path={`/entry/${dailyToken}`} />
      <p className="mt-6 text-sm font-medium text-accent">{messages.workerEntry}</p>
      <h1 className="mt-2 text-3xl font-semibold">{messages.verifyWorkerKeyTitle}</h1>
      <p className="mt-3 text-muted">
        {messages.linkValidUntil} {formatBangkokDateTime(result.dailyLink.expiresAt)}
      </p>
      <Link
        href={`/entry/${dailyToken}/verify`}
        className="mt-6 inline-flex w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        {messages.goToVerify}
      </Link>
    </main>
  );
}
