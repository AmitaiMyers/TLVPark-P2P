import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { LOCALES, LOCALE_DIRECTION } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { AppHeader } from "@/components/AppHeader";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallHint, OfflineBanner } from "@/components/StatusBanners";
import "../globals.css";

/** Heebo covers both Hebrew and Latin glyphs, so one font serves both locales. */
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return {
    title: dictionary.meta.appName,
    description: dictionary.meta.description,
    appleWebApp: { capable: true, title: dictionary.meta.appName, statusBarStyle: "default" },
    icons: {
      icon: [
        { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const status = (await getDictionary()).status;
  return (
    <html
      lang={locale}
      dir={LOCALE_DIRECTION[locale]}
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <OfflineBanner message={status.offline} />
        <AppHeader />
        {children}
        <InstallHint title={status.installTitle} body={status.installIos} dismissLabel={status.dismiss} />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
