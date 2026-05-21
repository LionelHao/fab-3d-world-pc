<script setup>
/**
 * PcProfileSidebar — Operator dashboard 侧栏（cd-8 .sidebar）
 *
 * Spec: docs/design/specs/p3.10-profile.md §3.C #1
 * Anchor: cd-8-desktop-profile.html line 320-470 (.sidebar / .side-card / .side-tabs / .side-foot)
 *
 * side-card(120px 头像 + handle + dossier 4 行) + side-tabs(8 stab) + side-foot(build + kbd-row)。
 */
defineProps({
  avatarText: { type: String, default: 'OP' },
  avatarSrc: { type: String, default: '' },
  handle: { type: String, default: '' },
  /** dossier: Array<{ k: string, v: string, chip?: boolean }> */
  dossier: { type: Array, default: () => [] },
  /** tabs: Array<{ ix: string, label: string, danger?: boolean }> */
  tabs: { type: Array, default: () => [] },
  /** foot: { version, build, lastDeploy, world } */
  foot: { type: Object, default: () => ({}) },
})

const activeIndex = defineModel('activeIndex', { type: Number, default: 0 })
const emit = defineEmits(['tab-click'])

function onTab(idx, tab) {
  activeIndex.value = idx
  emit('tab-click', tab)
}
</script>

<template>
  <aside class="pc-sidebar">
    <!-- side card -->
    <div class="pc-sidebar__card">
      <div class="pc-sidebar__av">
        <img v-if="avatarSrc" :src="avatarSrc" :alt="handle" class="pc-sidebar__av-img" />
        <span v-else>{{ avatarText }}</span>
      </div>
      <div class="pc-sidebar__handle">{{ handle }}</div>
      <div class="pc-sidebar__dossier">
        <div v-for="(d, idx) in dossier" :key="idx" class="pc-sidebar__line">
          <span class="pc-sidebar__k">{{ d.k }}</span>
          <span class="pc-sidebar__v">
            <span v-if="d.chip" class="pc-sidebar__tier-chip">{{ d.v }}</span>
            <template v-else>{{ d.v }}</template>
          </span>
        </div>
      </div>
    </div>

    <!-- side tabs -->
    <nav class="pc-sidebar__tabs">
      <button
        v-for="(tab, idx) in tabs"
        :key="tab.ix"
        type="button"
        class="pc-sidebar__tab"
        :class="{
          'pc-sidebar__tab--active': activeIndex === idx,
          'pc-sidebar__tab--danger': tab.danger,
        }"
        @click="onTab(idx, tab)"
      >
        <span class="pc-sidebar__tab-ix">{{ tab.ix }}</span>
        <span class="pc-sidebar__tab-lbl">{{ tab.label }}</span>
        <span class="pc-sidebar__tab-chev" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </span>
      </button>
    </nav>

    <!-- side foot -->
    <div class="pc-sidebar__foot">
      FBW v<b>{{ foot.version }}</b> · BUILD <b>{{ foot.build }}</b><br />
      LAST DEPLOY <b>{{ foot.lastDeploy }}</b><br />
      WORLD <b>{{ foot.world }}</b>
      <div class="pc-sidebar__kbd-row">
        <span class="pc-sidebar__kbd">⌘</span><span class="pc-sidebar__kbd">,</span>
        <span>OPEN DASHBOARD</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.pc-sidebar {
  position: sticky;
  top: 56px;
  align-self: flex-start;
  background: var(--paper);
  border: 1.5px solid var(--ink);
}

/* ===== side card ===== */
.pc-sidebar__card {
  padding: 16px;
  border-bottom: 1.5px solid var(--ink);
  text-align: center;
}
.pc-sidebar__av {
  width: 120px;
  height: 120px;
  background: var(--hilite);
  border: 1.5px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-56);
  color: var(--ink);
  letter-spacing: -0.02em;
  margin: 0 auto 12px;
  position: relative;
}
.pc-sidebar__av::after {
  content: "";
  position: absolute;
  inset: 4px;
  border: 1px dashed color-mix(in srgb, var(--ink) 25%, transparent);
  pointer-events: none;
}
.pc-sidebar__av-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pc-sidebar__handle {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-22);
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: -0.005em;
  margin-bottom: 10px;
  line-height: 1;
}
.pc-sidebar__dossier {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
}
.pc-sidebar__line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  justify-content: space-between;
}
.pc-sidebar__k {
  color: var(--ink-2);
  font-weight: 600;
  font-size: var(--text-9);
}
.pc-sidebar__v {
  color: var(--ink);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.pc-sidebar__tier-chip {
  background: var(--hilite);
  color: var(--ink);
  padding: 1px 5px;
  font-weight: 700;
  font-size: var(--text-9);
}

/* ===== side tabs ===== */
.pc-sidebar__tabs {
  padding: 8px 0;
  border-bottom: 1.5px solid var(--ink);
}
.pc-sidebar__tab {
  height: 45px;
  padding: 0 14px 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-left: 4px solid transparent;
  cursor: pointer;
  background: transparent;
  width: 100%;
  text-align: left;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-13);
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: -0.005em;
}
.pc-sidebar__tab-ix {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--accent-link);
  font-weight: 700;
  letter-spacing: 0.08em;
  width: 18px;
  flex-shrink: 0;
}
.pc-sidebar__tab-lbl { flex: 1; }
.pc-sidebar__tab-chev { color: var(--ink-3); display: inline-flex; }

.pc-sidebar__tab:hover { background: var(--paper-2); }
.pc-sidebar__tab:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
.pc-sidebar__tab--active {
  border-left-color: var(--hilite);
  background: var(--paper-3);
}
.pc-sidebar__tab--active .pc-sidebar__tab-chev { color: var(--ink); }
.pc-sidebar__tab--danger .pc-sidebar__tab-ix,
.pc-sidebar__tab--danger .pc-sidebar__tab-lbl { color: var(--semantic-warning); }

/* ===== side foot ===== */
.pc-sidebar__foot {
  padding: 12px 16px;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.6;
}
.pc-sidebar__foot b { color: var(--ink-2); }
.pc-sidebar__kbd-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--ink-2);
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-2);
}
.pc-sidebar__kbd {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  color: var(--ink);
  background: var(--paper-3);
  border: 1px solid var(--ink);
  padding: 1px 5px;
  letter-spacing: 0.04em;
}
</style>
