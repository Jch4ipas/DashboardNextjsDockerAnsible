/**
 * Admin layout: wraps the backoffice with the EPFL header and the
 * next-intl client provider so "use client" pages can call useTranslations().
 *
 * Why NextIntlClientProvider here (not root layout): i18n is backoffice-only.
 * The public dashboard page does not use translations.
 * https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing#layout
 */
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({ children }) {
  // getMessages() reads the locale from getRequestConfig (cookie-based)
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="admin-layout min-h-screen flex flex-col bg-base-200 text-base-content" data-theme="epfl">
        <AdminHeader />
        <main className="flex-1">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
