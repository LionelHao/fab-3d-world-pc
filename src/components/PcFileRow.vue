<script setup>
/**
 * PcFileRow — PC § 03 Files 单行 (format icon + name/desc + size + download btn)
 *
 * Spec: docs/design/specs/p3.4-pc-goods-detail.md §3 (B3R-6)
 * Anchor: cd-4-desktop.html line 1549-1594 (.file-row)
 *
 * 结构: fico (format chip, primary tone hilite) + fname (n 主名 + d 副描述) + fsize + fdl download btn
 */
defineProps({
  format: { type: String, required: true }, // 'STL'|'3MF'|'STEP'|'PDF'|'TXT'|...
  filename: { type: String, required: true },
  description: { type: String, default: '' },
  size: { type: String, default: '' }, // pre-formatted, e.g. '4.2 MB'
  primary: { type: Boolean, default: false }, // hilite tone (first file)
})

defineEmits(['download'])
</script>

<template>
  <div class="pc-file-row">
    <div
      class="pc-file-row__fico"
      :class="{ 'pc-file-row__fico--primary': primary }"
    >
      {{ format }}
    </div>
    <div class="pc-file-row__fname">
      <span class="pc-file-row__name">{{ filename }}</span>
      <span v-if="description" class="pc-file-row__desc">{{ description }}</span>
    </div>
    <span class="pc-file-row__size">{{ size }}</span>
    <button
      type="button"
      class="pc-file-row__dl"
      :aria-label="`Download ${filename}`"
      @click="$emit('download', $event)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.pc-file-row {
  display: grid;
  grid-template-columns: 56px 1fr auto 40px;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1.5px solid var(--ink);
  background: var(--paper);
}
.pc-file-row:first-child {
  border-top: 0;
}
.pc-file-row:hover {
  background: var(--paper-2);
}

/* ===== fico ===== */
.pc-file-row__fico {
  width: 56px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.pc-file-row__fico--primary {
  background: var(--ink);
  color: var(--hilite);
}

/* ===== fname ===== */
.pc-file-row__fname {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pc-file-row__name {
  font-family: var(--f-mono);
  font-size: var(--text-13);
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-file-row__desc {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  font-weight: 500;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== size ===== */
.pc-file-row__size {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 600;
  color: var(--ink-2);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

/* ===== fdl ===== */
.pc-file-row__dl {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  color: var(--ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-file-row__dl svg {
  width: 18px;
  height: 18px;
}
.pc-file-row__dl:hover {
  background: var(--ink);
  color: var(--paper);
  box-shadow: var(--glow-accent-sm);
}
.pc-file-row__dl:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}
</style>
