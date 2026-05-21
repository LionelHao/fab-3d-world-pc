<script setup>
/**
 * AdminFooter — Ops Console 底栏（cd-9 .foot）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.C
 * Anchor: cd-9-desktop-admin.html line 1187-1203 (.foot)
 *
 * ink 黑底：version · sessions · network + right(kbd 快捷键组)。
 */
defineProps({
  version: { type: String, default: '' },
  sessions: { type: String, default: '' },
  network: { type: String, default: '' },
  /** shortcuts: Array<{ keys: string[], label: string }> */
  shortcuts: { type: Array, default: () => [] },
})
</script>

<template>
  <footer class="admin-foot">
    <span>FBW · OPS CONSOLE <b>v{{ version }}</b></span>
    <span class="admin-foot__sep">/</span>
    <span>Active sessions · <b>{{ sessions }}</b></span>
    <span class="admin-foot__sep">/</span>
    <span>NETWORK <b>{{ network }}</b></span>
    <div class="admin-foot__right">
      <template v-for="(sc, idx) in shortcuts" :key="idx">
        <span v-if="idx > 0" class="admin-foot__sep">·</span>
        <span v-for="k in sc.keys" :key="k" class="admin-foot__kbd">{{ k }}</span>
        <span>{{ sc.label }}</span>
      </template>
    </div>
  </footer>
</template>

<style scoped>
.admin-foot {
  height: 28px;
  background: var(--ink);
  color: var(--paper);
  border-top: 1.5px solid var(--ink);
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  gap: 16px;
}
.admin-foot b { color: var(--hilite); }
.admin-foot__sep { color: var(--ink-3); }
.admin-foot__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-foot__kbd {
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 700;
  background: var(--paper);
  color: var(--ink);
  padding: 1px 5px;
  letter-spacing: 0.06em;
}
</style>
