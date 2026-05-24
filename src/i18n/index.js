/**
 * vue-i18n 实例 — pc 端
 *
 * **web + pc 各一份同源副本，改动须同步两端**（对齐 viewerSoul.js / UiReveal.vue 惯例）
 *
 * - Composition API 模式（legacy: false）
 * - fallbackLocale: 'zh-CN'
 * - 自动 glob src/locales/<locale>/*.json，按 locale 聚合
 * - DEV 期开 missingWarn 暴露漏译
 */
import { createI18n } from 'vue-i18n'
import { detectLocale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './detect'

const modules = import.meta.glob('../locales/**/*.json', { eager: true })

function loadMessages() {
  const messages = {}
  for (const path in modules) {
    const match = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/)
    if (!match) continue
    const [, locale, namespace] = match
    if (!messages[locale]) messages[locale] = {}
    messages[locale][namespace] = modules[path].default ?? modules[path]
  }
  return messages
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: loadMessages(),
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
  silentTranslationWarn: !import.meta.env.DEV,
})

export { SUPPORTED_LOCALES, DEFAULT_LOCALE }

export const t = (key, ...args) => i18n.global.t(key, ...args)
