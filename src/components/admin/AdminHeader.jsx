/**
 * EPFL-branded navigation header for the backoffice.
 *
 * Layout mirrors the official EPFL Next.js starter kit header
 * (https://github.com/epfl-si/next-starterkit):
 *   - EPFL logo hotlinked from the elements CDN, responsive height
 *   - Vertical separator, then the app title linking home
 *   - `justify-between` flex row with a light bottom border
 *   - Right cluster: session dropdown + FR/EN language selector
 *
 * This app additionally exposes Dashboard/Backoffice nav links (inline on
 * desktop, hamburger on mobile) which the starter kit does not have.
 *
 * Server component: resolves session and locale before rendering so there
 * is no client-side waterfall for auth or i18n data.
 */
import { auth } from "@/services/auth";
import { getUserLocale } from "@/lib/locale";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import SessionDropdown from "./SessionDropdown";

export default async function AdminHeader() {
  const [session, locale, t] = await Promise.all([
    auth(),
    getUserLocale(),
    getTranslations("header"),
  ]);

  return (
    <header className="flex items-center justify-between border-b-2 border-base-300 bg-white text-black py-2 px-2 sm:py-3 sm:px-6 select-none">
      {/* Left: EPFL logo + separator + app title + desktop nav */}
      <div className="flex items-center gap-2 sm:gap-4 p-1 sm:p-3">
        {/* EPFL logo — hotlinked from the EPFL elements CDN per visual identity */}
        <img
          src="https://epfl-si.github.io/elements/svg/epfl-logo.svg"
          alt="EPFL"
          width={97}
          height={28}
          className="h-4 sm:h-7 w-auto shrink-0"
        />
        <span className="border-l-2 border-solid h-4 sm:h-6 w-1 border-gray-300 shrink-0" />
        <Link href="/admin" className="text-black hover:text-primary">
          <h1 className="text-base sm:text-2xl font-bold -ml-1 sm:ml-0 whitespace-nowrap">
            BoardFSDash
          </h1>
        </Link>
        <nav className="hidden sm:flex gap-1 ml-2">
          <Link href="/" className="btn btn-ghost btn-sm">
            {t("nav.dashboard")}
          </Link>
          <Link href="/admin" className="btn btn-ghost btn-sm">
            {t("nav.backoffice")}
          </Link>
        </nav>
      </div>

      {/* Right: mobile menu (small screens) + session + language selector */}
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="dropdown dropdown-end sm:hidden">
          <label tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
          >
            <li><Link href="/">{t("nav.dashboard")}</Link></li>
            <li><Link href="/admin">{t("nav.backoffice")}</Link></li>
          </ul>
        </div>

        <SessionDropdown session={session} />
        <LanguageSelector currentLocale={locale} />
      </div>
    </header>
  );
}
