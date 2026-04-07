"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isSupportedLocale, localeCookieName } from "@/lib/i18n/locales";

export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  const path = String(formData.get("path") ?? "/");

  if (!isSupportedLocale(locale)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath(path);
}
