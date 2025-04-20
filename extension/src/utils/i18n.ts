import { standardizeLocale } from "@ziziyi/utils"
import type { i18n } from "i18next"

export function getLocale(lang?: string) {
  if (!lang) {
    lang = chrome.i18n.getUILanguage()
  }
  return standardizeLocale(lang)
}
