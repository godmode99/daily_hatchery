import { setLocaleAction } from "@/app/locale-actions";
import { localeLabels, supportedLocales, type SupportedLocale } from "@/lib/i18n/locales";

type LanguageSwitcherProps = {
  currentLocale: SupportedLocale;
  path: string;
};

export function LanguageSwitcher({ currentLocale, path }: LanguageSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Language">
      {supportedLocales.map((locale) => (
        <form action={setLocaleAction} key={locale}>
          <input name="locale" type="hidden" value={locale} />
          <input name="path" type="hidden" value={path} />
          <button
            className={
              locale === currentLocale
                ? "rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                : "rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted"
            }
            type="submit"
          >
            {localeLabels[locale]}
          </button>
        </form>
      ))}
    </div>
  );
}
