import { cookies } from "next/headers";
import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
  workerMessages,
  type SupportedLocale,
} from "@/lib/i18n/locales";

export async function getCurrentLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(localeCookieName)?.value;

  return isSupportedLocale(locale) ? locale : defaultLocale;
}

export async function getWorkerMessages() {
  const locale = await getCurrentLocale();

  return {
    locale,
    messages: workerMessages[locale],
  };
}
