"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";

import { defaultLocale, locales, type Locale } from "./config";

/**
 * Server action to set locale in cookies
 */
export async function setLocale(locale: Locale) {
  // Runtime validation required as TypeScript types don't exist at runtime
  if (!hasLocale(locales, locale)) {
    return { success: false, message: `Invalid locale: ${locale}` };
  }

  try {
    const cookieStore = await cookies();

    // Set locale cookie (expires in 1 year)
    // httpOnly: false allows client-side access for language switcher
    cookieStore.set("locale", locale, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: false, // Allows client-side access for UI components
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Revalidate entire layout to ensure all pages update with new locale
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Failed to set locale:", error);
    return {
      success: false,
      message: "Failed to set locale",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server action to get current locale
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;

  return hasLocale(locales, localeCookie) ? localeCookie : defaultLocale;
}
