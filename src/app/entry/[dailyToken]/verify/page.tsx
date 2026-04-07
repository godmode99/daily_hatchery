import { redirect } from "next/navigation";
import { verifyWorkerKeyAction } from "@/app/entry/[dailyToken]/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getWorkerMessages } from "@/lib/i18n/server";
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
  const { locale, messages } = await getWorkerMessages();
  const result = await validateDailyLink(dailyToken);

  if (!result.ok) {
    redirect(`/entry/${dailyToken}/expired`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
      <LanguageSwitcher currentLocale={locale} path={`/entry/${dailyToken}/verify`} />
      <p className="mt-6 text-sm font-medium text-accent">{messages.workerVerification}</p>
      <h1 className="mt-2 text-3xl font-semibold">{messages.enterPersonalKey}</h1>
      {error ? (
        <p className="mt-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          {error === "TOO_MANY_ATTEMPTS" ? getTooManyAttemptsMessage(locale) : messages.invalidKeyOrExpired}
        </p>
      ) : null}
      <form action={verifyWorkerKeyAction} className="mt-6 rounded-lg border border-border bg-card p-5">
        <input type="hidden" name="token" value={dailyToken} />
        <label className="block text-sm font-medium" htmlFor="worker-key">
          {messages.workerKey}
        </label>
        <input
          id="worker-key"
          name="key"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
          placeholder={messages.workerKeyPlaceholder}
          required
        />
        <button
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          type="submit"
        >
          {messages.confirm}
        </button>
      </form>
    </main>
  );
}

function getTooManyAttemptsMessage(locale: "th" | "my" | "en") {
  if (locale === "my") {
    return "ကီးမှားထည့်မှု များလွန်းပါသည်။ ခဏစောင့်ပြီး ပြန်လည်ကြိုးစားပါ။";
  }

  if (locale === "en") {
    return "Too many failed attempts. Please wait a moment and try again.";
  }

  return "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
}
