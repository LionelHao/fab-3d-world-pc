<script setup>
/**
 * AdminTicketsTable — Ops Console 工单 / 举报队列表（cd-9 .tt）
 *
 * Spec: docs/design/specs/p3.11-admin.md §3.B
 * Anchor: cd-9-desktop-admin.html line 684-768, 1081-1176 (.tt)
 *
 * 8 列 Id / Type / Target / Reporter / Sev / Status / Age / Actions。
 * 行内 sev / status 标签 tone 化；actions N 个 .ab（kind primary/crit/hilite）。
 */
defineProps({
  /** rows: Array<{ id, type, target, reporter, sev, sevClass, status, statusClass, age, actions[] }> */
  rows: { type: Array, default: () => [] },
})

const emit = defineEmits(['action'])

const columns = ['Id', 'Type', 'Target', 'Reporter', 'Sev', 'Status', 'Age', 'Actions']

/** IN_REVIEW → IN_REVIEW 显示原样 */
function statusLabel(s) {
  return String(s || '')
}
</script>

<template>
  <table class="admin-tt">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col" scope="col">{{ col }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, idx) in rows" :key="row.id || idx">
        <td><span class="admin-tt__id">{{ row.id }}</span></td>
        <td>{{ row.type }}</td>
        <td><span class="admin-tt__h">{{ row.target }}</span></td>
        <td><span class="admin-tt__muted">{{ row.reporter }}</span></td>
        <td>
          <span class="admin-tt__sev" :class="`admin-tt__sev--${row.sevClass}`">{{ row.sev }}</span>
        </td>
        <td>
          <span class="admin-tt__stt" :class="`admin-tt__stt--${row.statusClass}`">{{ statusLabel(row.status) }}</span>
        </td>
        <td>{{ row.age }}</td>
        <td>
          <div class="admin-tt__acts">
            <button
              v-for="(act, i) in row.actions"
              :key="i"
              type="button"
              class="admin-tt__ab"
              :class="act.kind ? `admin-tt__ab--${act.kind}` : ''"
              @click="emit('action', { ticket: row, action: act })"
            >{{ act.label }}</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.admin-tt {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--f-mono);
}
.admin-tt th {
  background: var(--paper-3);
  color: var(--ink-2);
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1.5px solid var(--ink);
  white-space: nowrap;
}
.admin-tt td {
  padding: 8px 10px;
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink);
  border-bottom: 1px solid var(--ink-2);
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}
.admin-tt tbody tr:last-child td { border-bottom: 0; }
.admin-tt tr:nth-of-type(even) td { background: var(--paper-2); }
.admin-tt__id { font-weight: 700; }
.admin-tt__h { color: var(--accent-link); font-weight: 600; }
.admin-tt__muted { color: var(--ink-2); }

.admin-tt__sev {
  display: inline-block;
  padding: 2px 5px;
  font-size: var(--text-9);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--paper);
}
.admin-tt__sev--crit { background: var(--semantic-danger); }
.admin-tt__sev--warn { background: var(--semantic-warning); }
.admin-tt__sev--info { background: var(--ink-2); }

.admin-tt__stt {
  display: inline-block;
  padding: 2px 6px;
  font-size: var(--text-9);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1.5px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
}
.admin-tt__stt--open {
  background: var(--semantic-danger);
  color: var(--paper);
  border-color: var(--semantic-danger);
}
.admin-tt__stt--review {
  background: var(--accent-link);
  color: var(--paper);
  border-color: var(--accent-link);
}
.admin-tt__stt--resolved { background: var(--hilite); color: var(--ink); }
.admin-tt__stt--info { background: var(--paper-3); color: var(--ink); }

.admin-tt__acts { display: flex; gap: 4px; }
.admin-tt__ab {
  height: 22px;
  padding: 0 7px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: var(--text-9);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}
.admin-tt__ab--primary { background: var(--ink); color: var(--hilite); }
.admin-tt__ab--crit {
  background: var(--semantic-danger);
  color: var(--paper);
  border-color: var(--semantic-danger);
}
.admin-tt__ab--hilite { background: var(--hilite); color: var(--ink); }
.admin-tt__ab:hover { background: var(--hilite); color: var(--ink); }
.admin-tt__ab:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
</style>
