<script setup>
/**
 * AdminAlert — Ops Console 单条告警卡（cd-9 .alert）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.B
 * Anchor: cd-9-desktop-admin.html line 575-664, 1037-1061 (.alert / .a-top / .acts)
 *
 * a-top(sev 标签 + age) + h4 标题 + since 行(<b> 解析) + acts(N 个 abtn)。
 */
import { parseRich } from '@/utils/parseRich'

defineProps({
  /** 'P1 · CRIT' */
  sev: { type: String, default: '' },
  /** 'crit' | 'warn' */
  tone: { type: String, default: 'warn' },
  age: { type: String, default: '' },
  title: { type: String, default: '' },
  /** 含 <b> 的描述行 */
  since: { type: String, default: '' },
  /** actions: Array<{ label, primary? }> */
  actions: { type: Array, default: () => [] },
})

const emit = defineEmits(['action'])
</script>

<template>
  <article class="admin-alert" :class="`admin-alert--${tone}`">
    <div class="admin-alert__top">
      <span class="admin-alert__sev">{{ sev }}</span>
      <span class="admin-alert__age">{{ age }}</span>
    </div>
    <h4 class="admin-alert__title">{{ title }}</h4>
    <span class="admin-alert__since">
      <template v-for="(seg, i) in parseRich(since)" :key="i"
        ><b v-if="seg.tag === 'b'">{{ seg.text }}</b
        ><template v-else>{{ seg.text }}</template
      ></template>
    </span>
    <div class="admin-alert__acts">
      <button
        v-for="(act, i) in actions"
        :key="i"
        type="button"
        class="admin-alert__btn"
        :class="{ 'admin-alert__btn--primary': act.primary }"
        @click="emit('action', act)"
      >{{ act.label }}</button>
    </div>
  </article>
</template>

<style scoped>
.admin-alert {
  border: 1.5px solid var(--ink);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--paper);
  position: relative;
}
.admin-alert--crit {
  border-color: var(--semantic-danger);
  background: color-mix(in srgb, var(--semantic-danger) 4%, var(--paper));
}
.admin-alert--warn {
  border-color: var(--semantic-warning);
  background: color-mix(in srgb, var(--semantic-warning) 4%, var(--paper));
}
.admin-alert__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.admin-alert__sev {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 6px;
  color: var(--paper);
}
.admin-alert--crit .admin-alert__sev { background: var(--semantic-danger); }
.admin-alert--warn .admin-alert__sev { background: var(--semantic-warning); }
.admin-alert__age {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.admin-alert__title {
  margin: 0;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-14);
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: -0.005em;
  line-height: 1.15;
}
.admin-alert__since {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.admin-alert__since b { color: var(--ink); font-weight: 600; }
.admin-alert__acts {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.admin-alert__btn {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: var(--text-10);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.admin-alert__btn--primary {
  background: var(--ink);
  color: var(--hilite);
}
.admin-alert--crit .admin-alert__btn--primary {
  background: var(--semantic-danger);
  color: var(--paper);
  border-color: var(--semantic-danger);
}
.admin-alert__btn:hover { background: var(--hilite); color: var(--ink); }
.admin-alert__btn--primary:hover { background: var(--hilite); color: var(--ink); }
.admin-alert__btn:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
</style>
