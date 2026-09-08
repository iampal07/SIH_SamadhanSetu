import { cookies } from "next/headers";
import { dictionaries, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, type LanguageCode } from "./index";

// For server components that need translated strings before any client JS
// runs (e.g. the submission success page). Reads the language cookie set by
// LanguageProvider; falls back to English when absent.
export async function getServerDictionary() {
  const store = await cookies();
  const raw = store.get(LANGUAGE_STORAGE_KEY)?.value;
  const lang = (raw && raw in dictionaries ? raw : DEFAULT_LANGUAGE) as LanguageCode;
  return dictionaries[lang];
}
