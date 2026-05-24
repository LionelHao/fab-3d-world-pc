/**
 * Locale 检测 — pc 端
 *
 * **web + pc 各一份同源副本，改动须同步两端**
 *
 * 策略（用户决策）：强制 zh-CN 起手，localStorage 记忆切换。
 */

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US']
export const DEFAULT_LOCALE = 'zh-CN'
export const LOCALE_STORAGE_KEY = 'fab.locale'

export function detectLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored
  } catch {
    // localStorage 不可用走默认
  }
  return DEFAULT_LOCALE
}

export function persistLocale(locale) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore
  }
}
