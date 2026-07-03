/**
 * FR / EN language toggle for the admin header.
 *
 * Visual identity follows the EPFL starter kit selector: bold labels,
 * the active locale in EPFL red, inactive locales in muted gray, split by
 * a thin vertical rule.
 *
 * Why useTransition: setUserLocale is a server action followed by
 * router.refresh(); wrapping it marks the update as non-urgent so the UI
 * stays responsive.
 * https://next-intl.dev/docs/usage/configuration#locale-cookie
 */
"use client";

import { Fragment, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserLocale } from "@/lib/locale";
import { locales } from "@/constants/i18n";

/**
 * @param {{ currentLocale: string }} props
 */
export default function LanguageSelector({ currentLocale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchLocale(locale) {
    startTransition(async () => {
      await setUserLocale(locale);
      router.refresh();
    });
  }

  return (
    <nav
      className="flex items-center space-x-1 text-sm sm:text-base"
      aria-label="Language selector"
    >
      {locales.map((locale, index) => {
        const isActive = currentLocale === locale;
        return (
          <Fragment key={locale}>
            {index > 0 && (
              <span className="border-l-2 border-solid h-4 w-1 border-gray-300" />
            )}
            <button
              type="button"
              onClick={() => switchLocale(locale)}
              disabled={pending || isActive}
              aria-current={isActive ? "true" : undefined}
              className={`cursor-pointer font-bold transition-colors ${
                pending ? "pointer-events-none" : ""
              } ${isActive ? "text-primary" : "text-gray-300 hover:text-gray-400"}`}
            >
              {locale.toUpperCase()}
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
