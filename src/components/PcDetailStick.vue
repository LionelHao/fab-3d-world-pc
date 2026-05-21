<script setup>
/**
 * PcDetailStick — PC detail 右栏 sticky 头 (d-head + d-author + tabs)
 *
 * Spec: docs/design/specs/p3.4-pc-goods-detail.md §3 (B3R-1, B3R-2)
 * Anchor: cd-4-desktop.html line 1477-1502 (.d-stick)
 *
 * 结构:
 *  - d-head:
 *    - .d-meta (sample-id + badge-cert hilite 反色)
 *    - h1 (cond 28px upper + .ver accent + .ver-num super)
 *    - .d-author (UiAvatar 28 + name @handle + Maker hilite badge + handle line + Follow btn)
 *  - tabs (5 tab × ix + label, active state controlled by parent)
 */
import UiAvatar from '@/components/ui/UiAvatar.vue'

defineProps({
  sampleCode: { type: String, required: true },
  classBadge: { type: String, default: 'CLASS A' },
  certified: { type: Boolean, default: false },
  modelName: { type: String, required: true },
  versionMajor: { type: [Number, String], default: '' },
  versionMinor: { type: [Number, String], default: '' },
  authorName: { type: String, required: true },
  authorHandle: { type: String, default: '' },
  authorFollowers: { type: String, default: '' },
  authorJoinedYear: { type: [Number, String], default: '' },
  authorIsMaker: { type: Boolean, default: false },
  isFollowing: { type: Boolean, default: false },
  tabs: { type: Array, default: () => [] }, // [{id, label, ix}]
  activeTab: { type: String, default: '' },
})

defineEmits(['follow-toggle', 'tab-change', 'author-click'])
</script>

<template>
  <div class="pc-detail-stick">
    <div class="pc-detail-stick__head">
      <div class="pc-detail-stick__meta">
        <span class="pc-detail-stick__sample-id">
          SAMPLE · <b>{{ sampleCode }}</b> · {{ classBadge }}
        </span>
        <span v-if="certified" class="pc-detail-stick__badge-cert">CERTIFIED ✓</span>
      </div>

      <h1 class="pc-detail-stick__h1">
        <span>{{ modelName }}</span>
        <span v-if="versionMajor !== ''" class="pc-detail-stick__ver">V{{ versionMajor }}</span>
        <span v-if="versionMinor !== ''" class="pc-detail-stick__ver-num">.{{ versionMinor }}</span>
      </h1>

      <div class="pc-detail-stick__author">
        <UiAvatar
          :name="authorName"
          :size="28"
          shape="square"
          :hilite-bg="true"
          :aria-label="`Avatar of ${authorName}`"
        />
        <div class="pc-detail-stick__who" @click="$emit('author-click')">
          <span class="pc-detail-stick__name">
            @{{ authorHandle || authorName }}
            <span v-if="authorIsMaker" class="pc-detail-stick__maker">Maker</span>
          </span>
          <span class="pc-detail-stick__handle">
            <template v-if="authorFollowers">{{ authorFollowers }} followers</template>
            <template v-if="authorFollowers && authorJoinedYear"> · </template>
            <template v-if="authorJoinedYear">joined {{ authorJoinedYear }}</template>
          </span>
        </div>
        <button
          type="button"
          class="pc-detail-stick__follow"
          :class="{ 'pc-detail-stick__follow--on': isFollowing }"
          @click="$emit('follow-toggle')"
        >
          {{ isFollowing ? 'Following' : 'Follow' }}
        </button>
      </div>
    </div>

    <div v-if="tabs.length" class="pc-detail-stick__tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="pc-detail-stick__tab"
        :class="{ 'pc-detail-stick__tab--active': tab.id === activeTab }"
        role="tab"
        :aria-selected="tab.id === activeTab"
        @click="$emit('tab-change', tab.id)"
      >
        <span class="pc-detail-stick__tab-ix">{{ tab.ix }}</span>
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pc-detail-stick {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--paper);
  border-bottom: 1.5px solid var(--ink);
  padding: 20px 20px 0;
}

/* ===== d-head ===== */
.pc-detail-stick__head {
  padding-bottom: 16px;
}

.pc-detail-stick__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.pc-detail-stick__sample-id {
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-detail-stick__sample-id b {
  color: var(--ink);
  font-weight: 700;
}
.pc-detail-stick__badge-cert {
  background: var(--hilite);
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.pc-detail-stick__h1 {
  margin: 0 0 14px;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 28px;
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--ink);
  text-transform: uppercase;
}
.pc-detail-stick__ver {
  color: var(--accent-link);
  font-weight: 700;
  margin-left: 6px;
}
.pc-detail-stick__ver-num {
  font-family: var(--f-mono);
  font-size: 14px;
  font-weight: 700;
  vertical-align: super;
  color: var(--accent-link);
  letter-spacing: 0;
  margin-left: 2px;
}

/* ===== author ===== */
.pc-detail-stick__author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pc-detail-stick__who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}
.pc-detail-stick__name {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 14px;
  color: var(--ink);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pc-detail-stick__maker {
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--hilite);
  padding: 1px 5px;
  line-height: 1.2;
}
.pc-detail-stick__handle {
  font-family: var(--f-mono);
  font-size: 10.5px;
  color: var(--ink-2);
  letter-spacing: 0.02em;
}
.pc-detail-stick__follow {
  height: 28px;
  padding: 0 14px;
  background: transparent;
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 120ms ease-out, color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-detail-stick__follow:hover { background: var(--paper-3); }
.pc-detail-stick__follow:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
.pc-detail-stick__follow--on {
  background: var(--ink);
  color: var(--paper);
}

/* ===== tabs ===== */
.pc-detail-stick__tabs {
  display: flex;
  gap: 0;
  margin: 0 -20px;
  border-top: 1.5px solid var(--ink);
  background: var(--paper-2);
  overflow-x: auto;
  scrollbar-width: none;
}
.pc-detail-stick__tabs::-webkit-scrollbar { display: none; }

.pc-detail-stick__tab {
  flex: 1 0 auto;
  height: 40px;
  padding: 0 14px;
  background: transparent;
  border: 0;
  border-right: 1px solid var(--ink-2);
  border-radius: var(--radius-none);
  color: var(--ink-2);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 120ms ease-out, color 120ms ease-out;
}
.pc-detail-stick__tab:last-child { border-right: 0; }
.pc-detail-stick__tab-ix {
  font-family: var(--f-mono);
  font-size: 9px;
  color: var(--accent-link);
  font-weight: 600;
  letter-spacing: 0.08em;
}
.pc-detail-stick__tab:hover:not(.pc-detail-stick__tab--active) {
  background: var(--paper-3);
  color: var(--ink);
}
.pc-detail-stick__tab:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--hilite);
}
.pc-detail-stick__tab--active {
  background: var(--ink);
  color: var(--paper);
}
.pc-detail-stick__tab--active .pc-detail-stick__tab-ix {
  color: var(--hilite);
}
</style>
