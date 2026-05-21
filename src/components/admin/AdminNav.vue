<script setup>
/**
 * AdminNav — Ops Console 顶栏（cd-9 .nav）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.C
 * Anchor: cd-9-desktop-admin.html line 803-833 (.nav / .wm / .app-mode / .ctx / .nav-right)
 *
 * nav-left(wm + app-mode 红底脉冲) + ctx(居中 mono 上下文) + nav-right(help / bell / avatar)。
 * icon-sq / avatar 内联以 1:1 复刻 cd-9 pip / ADM micro-badge（同 P3.4 studio NAV 内联先例）。
 */
defineProps({
  /** brand: { wordmark: { left, divider, right, tag }, appMode } */
  brand: { type: Object, default: () => ({}) },
  /** ctx: { operator, session, tickets, alerts, savedAgo } */
  ctx: { type: Object, default: () => ({}) },
  /** 头像 initials */
  avatarText: { type: String, default: 'KL' },
  /** bell 红点 */
  bellBadge: { type: Boolean, default: true },
})

const emit = defineEmits(['logo-click', 'help-click', 'bell-click', 'avatar-click'])
</script>

<template>
  <nav class="admin-nav">
    <div class="admin-nav__inner">
      <!-- left -->
      <div class="admin-nav__left">
        <a class="admin-nav__wm" href="#" @click.prevent="emit('logo-click')">
          {{ brand.wordmark?.left || 'FAB' }}
          <span class="admin-nav__div">{{ brand.wordmark?.divider || '/' }}</span>
          {{ brand.wordmark?.right || '3D' }}
          <span class="admin-nav__tag">{{ brand.wordmark?.tag || 'LAB' }}</span>
        </a>
        <span class="admin-nav__mode">{{ brand.appMode || 'ADMIN · OPS CONSOLE' }}</span>
      </div>

      <!-- ctx -->
      <div class="admin-nav__ctx">
        <span class="admin-nav__pill">{{ ctx.operator }}</span>
        <span>SESSION <b>{{ ctx.session }}</b></span>
        <span class="admin-nav__sep">/</span>
        <span>TICKETS <b>{{ ctx.tickets }}</b></span>
        <span class="admin-nav__sep">/</span>
        <span>ALERTS <b class="admin-nav__crit">{{ ctx.alerts }}</b></span>
        <span class="admin-nav__sep">/</span>
        <span class="admin-nav__saved">● Saved {{ ctx.savedAgo }}</span>
      </div>

      <!-- right -->
      <div class="admin-nav__right">
        <button class="admin-nav__isq" aria-label="Help" @click="emit('help-click')">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 .8-2 1.3-2 2.5" /><circle cx="12" cy="17" r="0.8" fill="currentColor" /></svg>
        </button>
        <button class="admin-nav__isq" aria-label="Notifications" @click="emit('bell-click')">
          <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
          <span v-if="bellBadge" class="admin-nav__pip" aria-hidden="true"></span>
        </button>
        <button class="admin-nav__avatar" aria-label="Account" @click="emit('avatar-click')">
          <span class="admin-nav__av-txt">{{ avatarText }}</span>
          <span class="admin-nav__av-badge">ADM</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.admin-nav {
  height: 56px;
  background: var(--paper);
  border-bottom: 1.5px solid var(--ink);
}
.admin-nav__inner {
  height: 100%;
  padding: 0 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
}
.admin-nav__left { display: flex; align-items: center; gap: 14px; }
.admin-nav__wm {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink);
  text-decoration: none;
  display: flex;
  align-items: baseline;
  gap: 6px;
  letter-spacing: -0.01em;
}
.admin-nav__div { color: var(--ink-3); font-weight: 500; }
.admin-nav__tag {
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 700;
  color: var(--ink);
  background: var(--hilite);
  padding: 2px 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transform: translateY(-2px);
}
.admin-nav__mode {
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--paper);
  background: var(--semantic-danger);
  padding: 5px 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.admin-nav__mode::before {
  content: "";
  width: 6px;
  height: 6px;
  background: var(--paper);
  border-radius: var(--radius-full);
  box-shadow: 0 0 6px color-mix(in srgb, var(--paper) 60%, transparent);
  animation: admin-nav-pulse 1.6s ease-in-out infinite;
}
@keyframes admin-nav-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.admin-nav__ctx {
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.admin-nav__pill {
  background: var(--ink);
  color: var(--hilite);
  padding: 4px 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
}
.admin-nav__sep { color: var(--ink-3); }
.admin-nav__ctx b { color: var(--ink); font-weight: 700; }
.admin-nav__crit { color: var(--semantic-danger); }
.admin-nav__saved { color: var(--accent-link); font-weight: 600; }

.admin-nav__right { display: flex; align-items: center; gap: 8px; }
.admin-nav__isq {
  width: 32px;
  height: 32px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  cursor: pointer;
  position: relative;
}
.admin-nav__isq svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.6;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.admin-nav__isq:hover { background: var(--hilite); }
.admin-nav__isq:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.admin-nav__pip {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  background: var(--semantic-danger);
  border: 1.5px solid var(--paper);
  border-radius: var(--radius-full);
}
.admin-nav__avatar {
  width: 32px;
  height: 32px;
  background: var(--ink);
  border: 1.5px solid var(--ink);
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.admin-nav__av-txt {
  font-family: var(--f-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--hilite);
}
.admin-nav__avatar:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.admin-nav__av-badge {
  position: absolute;
  bottom: -3px;
  right: -3px;
  background: var(--hilite);
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: 7px;
  font-weight: 700;
  padding: 0 3px;
  border: 1.5px solid var(--ink);
  letter-spacing: 0.06em;
}
</style>
