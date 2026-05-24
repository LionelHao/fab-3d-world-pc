import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@tokens/tokens.css'
import App from './App.vue'
import router from './router'
import { i18n } from '@/i18n'
import { useLocaleStore } from '@/stores/locale'

// Element Plus 仍 app.use 全局注册（保证 <el-*> 组件可用）；
// 但 locale 走 App.vue 顶层 <el-config-provider :locale>——ConfigProvider 通过
// provide/inject 覆盖 app.use 时传的初始 locale，实现 locale 响应式切换。
const app = createApp(App)
app.use(createPinia())
app.use(i18n)
useLocaleStore().bootstrap()
// document.title 跟随 locale（替代静态 index.html <title>，I4.2 收口）
watch(
  () => i18n.global.locale.value,
  () => { document.title = i18n.global.t('common.appTitle') },
  { immediate: true },
)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
