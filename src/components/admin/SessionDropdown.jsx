"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

/**
 * User avatar dropdown shown in the admin header.
 * Uses next-auth signOut for proper session invalidation.
 * https://authjs.dev/reference/nextjs#signout
 *
 * @param {{ session: import("next-auth").Session | null }} props
 */
export default function SessionDropdown({ session }) {
  const t = useTranslations("header");

  const displayName = session?.user?.email
    ?.replace("@epfl.ch", "")
    .replace(".", " ");

  return (
    <div className="flex items-center gap-2">
      {displayName && (
        <span className="hidden sm:inline capitalize text-sm">{displayName}</span>
      )}
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
          <div className="w-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {session?.user?.image ? (
              <img alt={displayName ?? "User"} src={session.user.image} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
        </div>
        <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-48 p-2 shadow">
          <li>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-error">
              {t("signOut")}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
