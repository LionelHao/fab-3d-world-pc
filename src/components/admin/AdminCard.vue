<script setup>
/**
 * AdminCard — Ops Console 共享卡壳（cd-9 .card）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.B
 * Anchor: cd-9-desktop-admin.html line 434-556 (.card / .card-head / .card-foot)
 *
 * card-head ink 黑条（可选 LED + num + title + stamp[tone]）+ default slot(body)
 * + 可选 #foot slot（.card-foot paper-2 底）。
 */
defineProps({
  /** 编号标，如 '§ S' / '§ A' / '§ T' */
  num: { type: String, default: '' },
  title: { type: String, default: '' },
  /** 右上印章文字 */
  stamp: { type: String, default: '' },
  /** '' | 'hilite' | 'crit' | 'warn' */
  stampTone: { type: String, default: '' },
  /** 头部脉冲 LED（live tail 用） */
  led: { type: Boolean, default: false },
})
</script>

<template>
  <section class="admin-card">
    <header class="admin-card__head">
      <div class="admin-card__left">
        <span v-if="led" class="admin-card__led" aria-hidden="true"></span>
        <span v-if="num" class="admin-card__num">{{ num }}</span>
        <span class="admin-card__title">{{ title }}</span>
      </div>
      <span
        v-if="stamp"
        class="admin-card__stamp"
        :class="stampTone ? `admin-card__stamp--${stampTone}` : ''"
      >{{ stamp }}</span>
    </header>

    <div class="admin-card__body">
      <slot />
    </div>

    <footer v-if="$slots.foot" class="admin-card__foot">
      <slot name="foot" />
    </footer>
  </section>
</template>

<style scoped>
.admin-card {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
}
.admin-card__head {
  background: var(--ink);
  color: var(--paper);
  padding: 7px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.admin-card__left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.admin-card__led {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--hilite);
  box-shadow: 0 0 6px var(--hilite);
  animation: admin-card-pulse 1.4s ease-in-out infinite;
  align-self: center;
}
@keyframes admin-card-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.admin-card__num { color: var(--hilite); font-weight: 600; }
.admin-card__title { color: var(--paper); }
.admin-card__stamp {
  font-family: var(--f-mono);
  font-size: 9px;
  background: transparent;
  color: var(--paper);
  border: 1px solid var(--ink-3);
  padding: 1px 5px;
  letter-spacing: 0.08em;
  font-weight: 500;
}
.admin-card__stamp--hilite {
  background: var(--hilite);
  color: var(--ink);
  border-color: var(--ink);
  font-weight: 700;
}
.admin-card__stamp--crit {
  background: var(--semantic-danger);
  color: var(--paper);
  border-color: var(--semantic-danger);
  font-weight: 700;
}
.admin-card__stamp--warn {
  background: var(--semantic-warning);
  color: var(--paper);
  border-color: var(--semantic-warning);
  font-weight: 700;
}
.admin-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.admin-card__foot {
  padding: 10px 12px;
  background: var(--paper-2);
  border-top: 1.5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
