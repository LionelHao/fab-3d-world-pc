<script setup>
/**
 * PcActivityLog — 操作活动日志表（cd-8 .log）
 *
 * Spec: docs/design/specs/p3.10-profile.md §3.D
 * Anchor: cd-8-desktop-profile.html line 720-800 (.log / .row / .log-foot)
 *
 * 6 行 grid(ts / type / desc / amt) + log-foot(meta + View full log)。
 * desc / amt 内联 <b>/<em> 用 segment 解析渲染（不用 v-html）。
 */
defineProps({
  /** rows: Array<{ date,time,type,typeClass,desc,amt }> */
  rows: { type: Array, default: () => [] },
  /** meta: { showing, total, window } */
  meta: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['view-log'])

/** 把含 <b>/<em> 的串解析为 segment 数组 */
function parseRich(html) {
  const text = String(html || '')
  const parts = []
  const re = /<(b|em)>(.*?)<\/\1>/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), tag: '' })
    parts.push({ text: m[2], tag: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), tag: '' })
  return parts.length ? parts : [{ text, tag: '' }]
}
</script>

<template>
  <div class="pc-log">
    <div class="pc-log__rows">
      <div v-for="(row, idx) in rows" :key="idx" class="pc-log__row">
        <span class="pc-log__ts">{{ row.date }} <b>{{ row.time }}</b></span>
        <span
          class="pc-log__type"
          :class="row.typeClass ? `pc-log__type--${row.typeClass}` : ''"
        >{{ row.type }}</span>
        <span class="pc-log__desc">
          <template v-for="(seg, i) in parseRich(row.desc)" :key="i"
            ><b v-if="seg.tag === 'b'">{{ seg.text }}</b
            ><em v-else-if="seg.tag === 'em'">{{ seg.text }}</em
            ><template v-else>{{ seg.text }}</template
          ></template>
        </span>
        <span class="pc-log__amt">
          <template v-for="(seg, i) in parseRich(row.amt)" :key="i"
            ><b v-if="seg.tag === 'b'">{{ seg.text }}</b
            ><template v-else>{{ seg.text }}</template
          ></template>
        </span>
      </div>
    </div>
    <div class="pc-log__foot">
      <span class="pc-log__meta">
        SHOWING {{ meta.showing }} OF <b>{{ meta.total }}</b> ENTRIES · {{ meta.window }}
      </span>
      <a href="#" class="pc-log__link" @click.prevent="emit('view-log')">View full log →</a>
    </div>
  </div>
</template>

<style scoped>
.pc-log__row {
  display: grid;
  grid-template-columns: 150px 100px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ink-2);
  font-family: var(--f-mono);
}
.pc-log__row:last-child {
  border-bottom: 1.5px solid var(--ink);
}

.pc-log__ts {
  font-size: 11px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.pc-log__ts b { color: var(--ink); font-weight: 600; }

.pc-log__type {
  font-family: var(--f-mono);
  font-size: 9.5px;
  color: var(--ink);
  padding: 3px 6px;
  border: 1.5px solid var(--ink);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  text-align: center;
  background: var(--paper);
  justify-self: flex-start;
}
.pc-log__type--up { background: var(--hilite); }
.pc-log__type--tip { background: var(--ink); color: var(--hilite); }
.pc-log__type--cert {
  background: var(--accent-link);
  color: var(--paper);
  border-color: var(--accent-link);
}

.pc-log__desc {
  font-family: var(--f-sans);
  font-size: 13px;
  color: var(--ink);
  font-weight: 500;
  line-height: 1.3;
}
.pc-log__desc b { color: var(--ink); font-weight: 700; }
.pc-log__desc em { font-style: normal; color: var(--ink-2); }

.pc-log__amt {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.pc-log__amt b { color: var(--ink); font-weight: 600; }

.pc-log__foot {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--paper-2);
}
.pc-log__meta {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--ink-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-log__meta b { color: var(--ink); }
.pc-log__link {
  color: var(--ink);
  text-decoration: none;
  font-family: var(--f-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 1.5px solid var(--ink);
  padding-bottom: 1px;
}
.pc-log__link:hover { background: var(--hilite); }
</style>
