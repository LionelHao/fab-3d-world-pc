<script setup>
/**
 * AdminBanDialog — 封禁用户对话框（user-auth P4）
 *
 * Spec: docs/user-auth-impl.md §2.1 + 01-architecture.md §11 P4
 *
 * 行为：reason 必填 + untilAt 可选 ElDatePicker；submit emit('submit', { reason, untilAt }).
 * 父组件接 submit 调 banUser(id, body) 后再用 v-model:open=false 关闭。
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElForm, ElFormItem, ElInput, ElDatePicker, ElMessage } from 'element-plus'

const props = defineProps({
  open: { type: Boolean, default: false },
  user: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:open', 'submit'])

const { t } = useI18n()

const reason = ref('')
const untilAt = ref(null)

watch(
  () => props.open,
  (v) => {
    if (v) {
      reason.value = ''
      untilAt.value = null
    }
  },
)

const title = computed(() =>
  t('admin.users.banDialog.title', { name: props.user?.username || props.user?.userId || '' }),
)

function onCancel() {
  emit('update:open', false)
}

function onSubmit() {
  const trimmed = reason.value.trim()
  if (!trimmed) {
    ElMessage.warning(t('admin.toast.reasonRequired'))
    return
  }
  const body = { reason: trimmed }
  if (untilAt.value) {
    body.untilAt = new Date(untilAt.value).toISOString()
  }
  emit('submit', body)
  emit('update:open', false)
}
</script>

<template>
  <ElDialog
    :model-value="open"
    :title="title"
    width="480px"
    append-to-body
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:open', v)"
  >
    <ElForm label-position="top">
      <ElFormItem :label="t('admin.users.banDialog.reason')" required>
        <ElInput
          v-model="reason"
          type="textarea"
          :rows="3"
          :placeholder="t('admin.users.banDialog.reasonPlaceholder')"
          maxlength="200"
          show-word-limit
          data-test="adm-ban-reason"
        />
      </ElFormItem>
      <ElFormItem :label="t('admin.users.banDialog.until')">
        <ElDatePicker
          v-model="untilAt"
          type="datetime"
          :placeholder="t('admin.users.banDialog.untilHelp')"
          style="width: 100%"
          data-test="adm-ban-until"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <button type="button" class="adm-btn adm-btn--ghost" data-test="adm-ban-cancel" @click="onCancel">
        {{ t('common.actions.cancel') }}
      </button>
      <button type="button" class="adm-btn adm-btn--crit" data-test="adm-ban-submit" @click="onSubmit">
        {{ t('admin.users.banDialog.submit') }}
      </button>
    </template>
  </ElDialog>
</template>

<style scoped>
.adm-btn {
  height: 32px;
  padding: 0 14px;
  background: var(--paper);
  border: 1.5px solid var(--ink);
  color: var(--ink);
  font-family: var(--f-mono);
  font-weight: 700;
  font-size: var(--text-11);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  margin-left: 8px;
}
.adm-btn--ghost { background: var(--paper); }
.adm-btn--ghost:hover { background: var(--hilite); }
.adm-btn--crit {
  background: var(--ink);
  color: var(--paper);
}
.adm-btn--crit:hover { background: var(--crit, #b00020); }
.adm-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
