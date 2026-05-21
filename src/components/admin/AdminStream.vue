<script setup>
/**
 * AdminStream — Ops Console 实时事件流（cd-9 .stream）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.B
 * Anchor: cd-9-desktop-admin.html line 478-539, 1006-1019 (.stream / .stream-row)
 *
 * N 行 stream-row(grid ts / type / desc)。ts 末两位秒加粗；type 11 种配色；
 * desc 含 <b>/<em>/<n>/<crit> 经 parseRich segment 渲染（不用 v-html）。
 */
import { parseRich } from '@/utils/parseRich'

defineProps({
  /** rows: Array<{ ts, type, typeClass, desc }> */
  rows: { type: Array, default: () => [] },
})

/** '09:41:22' → { head: '09:41:', sec: '22' } */
function splitTs(ts) {
  const s = String(ts || '')
  return { head: s.slice(0, -2), sec: s.slice(-2) }
}
</script>

<template>
  <div class="admin-stream">
    <div v-for="(row, idx) in rows" :key="idx" class="admin-stream__row">
      <span class="admin-stream__ts">{{ splitTs(row.ts).head }}<b>{{ splitTs(row.ts).sec }}</b></span>
      <span
        class="admin-stream__type"
        :class="row.typeClass ? `admin-stream__type--${row.typeClass}` : ''"
      >{{ row.type }}</span>
      <span class="admin-stream__desc">
        <template v-for="(seg, i) in parseRich(row.desc)" :key="i"
          ><b v-if="seg.tag === 'b'">{{ seg.text }}</b
          ><em v-else-if="seg.tag === 'em'">{{ seg.text }}</em
          ><span v-else-if="seg.tag === 'n'" class="admin-stream__num">{{ seg.text }}</span
          ><span v-else-if="seg.tag === 'crit'" class="admin-stream__crit">{{ seg.text }}</span
          ><template v-else>{{ seg.text }}</template
        ></template>
      </span>
    </div>
  </div>
</template>

<style scoped>
.admin-stream {
  flex: 1;
  overflow: hidden;
}
.admin-stream__row {
  display: grid;
  grid-template-columns: 92px 96px 1fr;
  gap: 10px;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid var(--ink-2);
  font-family: var(--f-mono);
}
.admin-stream__row:nth-of-type(even) { background: var(--paper-2); }
.admin-stream__row:last-child { border-bottom: 0; }

.admin-stream__ts {
  font-size: 10.5px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.admin-stream__ts b { color: var(--ink); font-weight: 600; }

.admin-stream__type {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  color: var(--ink);
  padding: 2px 5px;
  border: 1.5px solid var(--ink);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  background: var(--paper);
  text-align: center;
  justify-self: stretch;
}
.admin-stream__type--upload { background: var(--hilite); }
.admin-stream__type--order { background: var(--ink); color: var(--hilite); }
.admin-stream__type--register {
  background: var(--accent-link);
  color: var(--paper);
  border-color: var(--accent-link);
}
.admin-stream__type--error {
  background: var(--semantic-danger);
  color: var(--paper);
  border-color: var(--semantic-danger);
}
.admin-stream__type--tip { background: var(--ink); color: var(--hilite); }
.admin-stream__type--comment { background: var(--paper-3); }
.admin-stream__type--report {
  background: var(--semantic-warning);
  color: var(--paper);
  border-color: var(--semantic-warning);
}
.admin-stream__type--cert {
  background: var(--accent-link);
  color: var(--paper);
  border-color: var(--accent-link);
}
.admin-stream__type--follow { background: var(--paper); }
.admin-stream__type--deploy { background: var(--ink); color: var(--hilite); }
.admin-stream__type--api { background: var(--paper); }
.admin-stream__type--backup { background: var(--paper); }

.admin-stream__desc {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink);
  font-weight: 500;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.admin-stream__desc b { color: var(--ink); font-weight: 700; }
.admin-stream__desc em { font-style: normal; color: var(--ink-2); }
.admin-stream__num { color: var(--accent-link); font-weight: 700; }
.admin-stream__crit { color: var(--semantic-danger); font-weight: 700; }
</style>
