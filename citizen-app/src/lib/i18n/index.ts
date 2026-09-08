import en from "./en";
import hi from "./hi";
import khortha from "./khortha";
import type { Dictionary } from "./en";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "kht", label: "खोठा (Khortha)" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const dictionaries: Record<LanguageCode, Dictionary> = { en, hi, kht: khortha };

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const LANGUAGE_STORAGE_KEY = "citizen_app_language";

export type { Dictionary };
