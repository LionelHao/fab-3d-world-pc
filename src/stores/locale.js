/**
 * Locale Pinia store — pc 端
 *
 * **web + pc 各一份同源副本，改动须同步两端**
 *
 * setLocale(name) 同时：
 *   1. 切 vue-i18n 实例 locale
 *   2. 写 localStorage
 *   3. 暴露 elLocale getter 供 <el-config-provider :locale> 响应式订阅
 *      （Element Plus 推荐用 ConfigProvider，比 app.use(ElementPlus, {locale})
 *       响应式更好——切换时所有 el-* 组件会自动重渲染）
 *   4. 设置 <html lang>
 */
import { defineStore } from 'pinia'
import elZhCn from 'element-plus/dist/locale/zh-cn.mjs'
import elEn from 'element-plus/dist/locale/en.mjs'
import { i18n } from '@/i18n'
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  detectLocale,
  persistLocale,
} from '@/i18n/detect'

const EL_LOCALE_MAP = {
  'zh-CN': elZhCn,
  'en-US': elEn,
}

function applyHtmlLang(name) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = name
  }
}

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    current: detectLocale(),
  }),
  getters: {
    supported: () => SUPPORTED_LOCALES,
    isZh: (s) => s.current === 'zh-CN',
    isEn: (s) => s.current === 'en-US',
    /** 供 <el-config-provider :locale="elLocale"> 使用 */
    elLocale: (s) => EL_LOCALE_MAP[s.current] || EL_LOCALE_MAP[DEFAULT_LOCALE],
  },
  actions: {
    setLocale(name) {
      if (!SUPPORTED_LOCALES.includes(name)) return
      this.current = name
      i18n.global.locale.value = name
      persistLocale(name)
      applyHtmlLang(name)
    },
    bootstrap() {
      const name = this.current || DEFAULT_LOCALE
      i18n.global.locale.value = name
      applyHtmlLang(name)
    },
  },
})
