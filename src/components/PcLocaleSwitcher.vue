<script setup>
/**
 * PcLocaleSwitcher — PC Navbar 右侧 locale 切换器
 *
 * 装配: 同 PcNavbar `pc-navbar__locale` 视觉规格（28h、ink 边、mono small upper），
 *   点击展开两项菜单（中文 / English），用 ElDropdown 驱动。
 * 用法: <PcLocaleSwitcher />（自动接 useLocaleStore）
 */
import { computed } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { useLocaleStore } from '@/stores/locale'

const locale = useLocaleStore()

const options = [
  { code: 'zh-CN', label: '中文', display: '中文' },
  { code: 'en-US', label: 'English', display: 'EN' },
]

const currentDisplay = computed(
  () => options.find((o) => o.code === locale.current)?.display ?? 'EN',
)

const onCommand = (code) => locale.setLocale(code)
</script>

<template>
  <el-dropdown trigger="click" placement="bottom-end" @command="onCommand">
    <button class="pc-loc" type="button" :aria-label="`Language: ${currentDisplay}`">
      <span class="pc-loc__glyph" aria-hidden="true">A</span>
      <span class="pc-loc__txt">{{ currentDisplay }}</span>
      <svg class="pc-loc__caret" viewBox="0 0 12 8" aria-hidden="true">
        <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="opt in options"
          :key="opt.code"
          :command="opt.code"
          :class="{ 'is-active': opt.code === locale.current }"
        >
          {{ opt.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.pc-loc {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  background: var(--paper);
  border: 1px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  border-radius: var(--radius-none);
  transition: background-color 120ms ease-out;
}
.pc-loc:hover { background: var(--paper-3); }
.pc-loc:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.pc-loc__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: var(--ink);
  color: var(--hilite);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-10);
  line-height: 1;
}
.pc-loc__caret {
  width: 8px;
  height: 6px;
  color: var(--ink-2);
}
</style>
