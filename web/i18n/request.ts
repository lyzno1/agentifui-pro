import { cookies } from "next/headers";
import deepmerge from "deepmerge";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales, namespaces, type Locale } from "./config";

// Flexible type to support any translation structure (strings, objects, arrays, ICU format, etc.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationValue = string | { [key: string]: any } | unknown[];
type NamespaceMessages = Record<string, TranslationValue>;

async function importNamespaceMessages(
  locale: Locale
): Promise<NamespaceMessages> {
  const entries = await Promise.all(
    namespaces.map(async namespace => {
      try {
        const moduleMessages = (
          await import(`../messages/${locale}/${namespace}.json`)
        ).default;
        return [namespace, moduleMessages] as const;
      } catch {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Missing translation file for ${locale}/${namespace}.json`
          );
        }
        return [namespace, {}] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

async function loadMessages(locale: Locale) {
  const userMessages = await importNamespaceMessages(locale);

  if (locale === defaultLocale) {
    return userMessages;
  }

  const defaultMessages = await importNamespaceMessages(defaultLocale);
  return deepmerge(defaultMessages, userMessages, {
    arrayMerge: (_, sourceArray) => sourceArray, // Override arrays completely with user translations (no merging)
  });
}

async function getLocaleFromStorage(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  return hasLocale(locales, localeCookie) ? localeCookie : defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getLocaleFromStorage();

  return {
    locale,
    messages: await loadMessages(locale),
    onError() {},
    getMessageFallback({ namespace, key }) {
      const path = [namespace, key].filter(part => part != null).join(".");
      return path;
    },
  };
});
