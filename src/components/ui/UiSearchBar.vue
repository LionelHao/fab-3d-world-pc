<script setup>
/**
 * UiSearchBar — 搜索框原子组件（PC 版）
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.2 (nav-search width 480 h 36 + kbd "⌘ K")
 * Anchor: cd-3-desktop.html line 117-163
 *
 * 与 mobile 版差异:
 *  - 增加 `kbd` prop（右侧 outline shortcut hint，如 "⌘ K"）
 *  - height 默认 36 (cd-3 nav-search)，可通过 size prop 切到 44 (cd-1 风格)
 *
 * 必须覆盖变体:
 *  - 默认 (QUERY label + kbd "⌘ K" + 居中宽搜索)
 *  - 无 label / 无 kbd
 *  - 不同数量 leading/trailing actions
 *  - focused / unfocused
 */
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'QUERY' },
  placeholder: { type: String, default: '' },
  kbd: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['md', 'lg'].includes(v) },
  leadingActions: { type: Array, default: () => [] },
  trailingActions: { type: Array, default: () => [] },
  hideLabel: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const onInput = (e) => emit('update:modelValue', e.target.value)
const onSubmit = () => emit('submit', props.modelValue)
const onKeyDown = (e) => {
  if (e.key === 'Enter') onSubmit()
}

const showLabel = computed(() => !props.hideLabel && props.label)
</script>

<template>
  <form
    class="ui-searchbar"
    :class="[`ui-searchbar--${size}`]"
    role="search"
    @submit.prevent="onSubmit"
  >
    <span v-if="showLabel" class="ui-searchbar__label">{{ label }}</span>

    <button
      v-for="(action, i) in leadingActions"
      :key="`l-${i}`"
      type="button"
      class="ui-searchbar__iconbtn"
      :class="{ 'ui-searchbar__iconbtn--primary': action.variant === 'primary' }"
      :aria-label="action.ariaLabel"
      @click="action.onClick && action.onClick()"
    >
      <component :is="action.icon" />
    </button>

    <input
      type="search"
      class="ui-searchbar__input"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="label || 'Search'"
      @input="onInput"
      @keydown="onKeyDown"
    />

    <span v-if="kbd" class="ui-searchbar__kbd">{{ kbd }}</span>

    <button
      v-for="(action, i) in trailingActions"
      :key="`t-${i}`"
      type="button"
      class="ui-searchbar__iconbtn"
      :class="{ 'ui-searchbar__iconbtn--primary': action.variant === 'primary' }"
      :aria-label="action.ariaLabel"
      @click="action.onClick && action.onClick()"
    >
      <component :is="action.icon" />
    </button>
  </form>
</template>

<style scoped>
.ui-searchbar {
  display: flex;
  align-items: stretch;
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  background: var(--paper);
  margin: 0;
}

.ui-searchbar--md { height: 36px; }
.ui-searchbar--lg { height: 44px; }

.ui-searchbar__label {
  font-family: var(--f-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--ink);
  color: var(--paper);
  padding: 0 var(--space-10);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ui-searchbar__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 0 var(--space-10);
}

.ui-searchbar__input::placeholder { color: var(--ink-3); }
.ui-searchbar__input::-webkit-search-cancel-button,
.ui-searchbar__input::-webkit-search-decoration { -webkit-appearance: none; }

.ui-searchbar__kbd {
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 600;
  color: var(--ink-2);
  border: 1px solid var(--ink-2);
  padding: 1px 5px;
  letter-spacing: 0.06em;
  align-self: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.ui-searchbar__iconbtn {
  width: 38px;
  height: 100%;
  border: 0;
  border-left: 1.5px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 120ms ease-out, color 120ms ease-out, box-shadow 120ms ease-out;
}

.ui-searchbar__iconbtn:hover { background: var(--paper-3); }
.ui-searchbar__iconbtn:active { background: var(--paper-3); }
.ui-searchbar__iconbtn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1.5px var(--hilite), 0 0 0 2px var(--ink);
}

.ui-searchbar__iconbtn--primary {
  background: var(--ink);
  color: var(--hilite);
}
.ui-searchbar__iconbtn--primary:hover { background: var(--accent-link); color: var(--paper); }
.ui-searchbar__iconbtn--primary:active { background: var(--accent-link); }
.ui-searchbar__iconbtn--primary:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1.5px var(--hilite), 0 0 0 2px var(--paper);
}

.ui-searchbar:focus-within {
  box-shadow: inset 0 0 0 1px var(--hilite);
}
</style>
