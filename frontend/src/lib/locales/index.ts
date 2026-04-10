import { enUS } from "./en-US";
import { ptBR } from "./pt-BR";
import { frFR } from "./fr-FR";

export const resources = {
  "en-US": { translation: enUS },
  "pt-BR": { translation: ptBR },
  "fr-FR": { translation: frFR },
} as const;

export type TranslationKeys = typeof enUS;

export type LanguageCode = "en-US" | "pt-BR" | "fr-FR";

export type Language = {
  code: LanguageCode;
  label: string;
};

export const languages: Language[] = [
  { code: "en-US", label: "English" },
  { code: "pt-BR", label: "Português" },
  { code: "fr-FR", label: "Français" },
];

export { enUS, ptBR, frFR };
