<script setup>
/**
 * AdminSidebar — Ops Console 侧栏（cd-9 .sidebar）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.C
 * Anchor: cd-9-desktop-admin.html line 861-911 (.sidebar / .side-section / .side-hd / .stab)
 *
 * 6 side-section（side-hd §NN + name + count[tone] + N stab）+ side-foot 3 行。
 * v-model:active = stab 的 ix 字符串（如 '01.1'）；emit tab-click。
 */
defineProps({
  /** sections: Array<{ ix, name, count, countTone?, danger?, tabs: [{ ix, label, pill?, pillTone? }] }> */
  sections: { type: Array, default: () => [] },
  /** foot: Array<{ k, v }> */
  foot: { type: Array, default: () => [] },
})

const active = defineModel('active', { type: String, default: '01.1' })
const emit = defineEmits(['tab-click'])

function onTab(section, tab) {
  active.value = tab.ix
  emit('tab-click', { section, tab })
}
</script>

<template>
  <aside class="admin-sidebar">
    <div
      v-for="section in sections"
      :key="section.ix"
      class="admin-sidebar__section"
      :class="{ 'admin-sidebar__section--danger': section.danger }"
    >
      <div class="admin-sidebar__hd" :class="{ 'admin-sidebar__hd--danger': section.danger }">
        <span>
          <span class="admin-sidebar__ix" :class="{ 'admin-sidebar__ix--crit': section.danger }">{{ section.ix }}</span>
          {{ section.name }}
        </span>
        <span
          class="admin-sidebar__count"
          :class="section.countTone ? `admin-sidebar__count--${section.countTone}` : ''"
        >{{ section.count }}</span>
      </div>
      <button
        v-for="tab in section.tabs"
        :key="tab.ix"
        type="button"
        class="admin-sidebar__stab"
        :class="{
          'admin-sidebar__stab--active': active === tab.ix,
          'admin-sidebar__stab--danger': section.danger,
        }"
        @click="onTab(section, tab)"
      >
        <span class="admin-sidebar__stab-ix">{{ tab.ix }}</span>
        <span class="admin-sidebar__stab-lbl">{{ tab.label }}</span>
        <span
          v-if="tab.pill"
          class="admin-sidebar__pill"
          :class="tab.pillTone ? `admin-sidebar__pill--${tab.pillTone}` : ''"
        >{{ tab.pill }}</span>
      </button>
    </div>

    <div class="admin-sidebar__foot">
      <div v-for="row in foot" :key="row.k" class="admin-sidebar__foot-row">
        <span>{{ row.k }}</span><b>{{ row.v }}</b>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  background: var(--paper);
  border-right: 1.5px solid var(--ink);
  display: flex;
  flex-direction: column;
}
.admin-sidebar__section {
  border-bottom: 1.5px solid var(--ink);
}
.admin-sidebar__section--danger {
  margin-top: auto;
}
.admin-sidebar__hd {
  padding: 8px 12px;
  background: var(--paper-2);
  border-bottom: 1.5px solid var(--ink-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.admin-sidebar__hd--danger {
  background: color-mix(in srgb, var(--semantic-danger) 8%, var(--paper));
}
.admin-sidebar__ix { color: var(--accent-link); }
.admin-sidebar__ix--crit { color: var(--semantic-danger); }
.admin-sidebar__count {
  font-family: var(--f-mono);
  font-size: 9px;
  background: var(--ink);
  color: var(--hilite);
  padding: 1px 5px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.admin-sidebar__count--warn { background: var(--semantic-warning); color: var(--paper); }
.admin-sidebar__count--crit { background: var(--semantic-danger); color: var(--paper); }

.admin-sidebar__stab {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 8px;
  background: transparent;
  border: 0;
  border-top: 1.5px solid var(--ink-2);
  border-left: 4px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 12px;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: -0.005em;
}
.admin-sidebar__stab:first-of-type { border-top: 0; }
.admin-sidebar__stab-ix {
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--accent-link);
  font-weight: 700;
  width: 22px;
  flex-shrink: 0;
  letter-spacing: 0.06em;
}
.admin-sidebar__stab-lbl { flex: 1; }
.admin-sidebar__pill {
  font-family: var(--f-mono);
  font-size: 9px;
  background: var(--paper-3);
  color: var(--ink);
  padding: 1px 4px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.admin-sidebar__pill--warn { background: var(--semantic-warning); color: var(--paper); }
.admin-sidebar__pill--crit { background: var(--semantic-danger); color: var(--paper); }
.admin-sidebar__stab:hover { background: var(--paper-2); }
.admin-sidebar__stab:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.admin-sidebar__stab--active {
  border-left-color: var(--hilite);
  background: var(--paper-3);
}
.admin-sidebar__stab--danger .admin-sidebar__stab-ix,
.admin-sidebar__stab--danger .admin-sidebar__stab-lbl { color: var(--semantic-danger); }
.admin-sidebar__stab--danger:hover {
  background: color-mix(in srgb, var(--semantic-danger) 6%, var(--paper));
}

.admin-sidebar__foot {
  padding: 12px;
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.7;
  border-top: 1.5px solid var(--ink);
  background: var(--paper-2);
}
.admin-sidebar__foot-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
}
.admin-sidebar__foot-row b { color: var(--ink-2); }
</style>
