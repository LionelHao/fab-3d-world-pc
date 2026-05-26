<script setup>
/**
 * AdminRoleEditDialog — 角色编辑对话框（user-auth P4，super_admin only）
 *
 * Spec: docs/user-auth-impl.md §2.1 + 01-architecture.md §11 P4 (`PUT /admin/users/{id}/roles`)
 *
 * 行为：
 *   - 列出全部可选 role（与后端 RoleCode 枚举对齐），预选 user.roles
 *   - 校验：至少保留一个角色；不能给自己降 super_admin
 *   - submit → emit('submit', { add: [...], remove: [...] }) 计算 diff，父组件再调 setUserRoles(id, body)
  * @spec docs/design/user-auth/01-architecture.md#5.3.3
 * @spec docs/design/user-auth/01-architecture.md#8
 * @capability user-auth.rbac-admin-ops
 * @since P4
 */
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElDialog, ElCheckboxGroup, ElCheckbox, ElMessage } from 'element-plus'

const props = defineProps({
  open: { type: Boolean, default: false },
  user: { type: Object, default: () => ({}) },
  /** 当前登录的 super_admin 自己的 userId */
  currentUserId: { type: [String, Number], default: '' },
})
const emit = defineEmits(['update:open', 'submit'])

const { t } = useI18n()

const ALL_ROLES = ['user', 'verified_user', 'creator', 'moderator', 'admin', 'super_admin']

const checked = ref([])
const initial = ref([])

watch(
  () => props.open,
  (v) => {
    if (v) {
      const initRoles = Array.isArray(props.user?.roles) ? [...props.user.roles] : []
      checked.value = [...initRoles]
      initial.value = [...initRoles]
    }
  },
  { immediate: true },
)

const title = computed(() =>
  t('admin.users.rolesDialog.title', { name: props.user?.username || props.user?.userId || '' }),
)

function onCancel() {
  emit('update:open', false)
}

function onSubmit() {
  // 至少保留一个角色
  if (checked.value.length === 0) {
    ElMessage.warning(t('admin.toast.rolesRequired'))
    return
  }
  // 不能给自己降 super_admin
  const isSelf =
    String(props.user?.userId ?? '') === String(props.currentUserId ?? '') &&
    String(props.currentUserId ?? '') !== ''
  if (isSelf && initial.value.includes('super_admin') && !checked.value.includes('super_admin')) {
    ElMessage.warning(t('admin.toast.cannotDemoteSelf'))
    return
  }
  const add = checked.value.filter((r) => !initial.value.includes(r))
  const remove = initial.value.filter((r) => !checked.value.includes(r))
  if (add.length === 0 && remove.length === 0) {
    // 无变化，直接关
    emit('update:open', false)
    return
  }
  emit('submit', { add, remove })
  emit('update:open', false)
}

function roleLabel(role) {
  return t(`admin.roles.${role}`)
}

// test-only：暴露 checked 给 spec 直接断言 / 操作（生产 UX 不依赖）
defineExpose({ checked })
</script>

<template>
  <ElDialog
    :model-value="open"
    :title="title"
    width="520px"
    append-to-body
    :close-on-click-modal="false"
    @update:model-value="(v) => emit('update:open', v)"
  >
    <p class="adm-roles__help">{{ t('admin.users.rolesDialog.help') }}</p>
    <ElCheckboxGroup v-model="checked" class="adm-roles__group">
      <ElCheckbox v-for="role in ALL_ROLES" :key="role" :value="role">
        <span class="adm-roles__chip">
          <code class="adm-roles__code">{{ role }}</code>
          <span class="adm-roles__name">{{ roleLabel(role) }}</span>
        </span>
      </ElCheckbox>
    </ElCheckboxGroup>
    <template #footer>
      <button type="button" class="adm-btn adm-btn--ghost" data-test="adm-roles-cancel" @click="onCancel">
        {{ t('common.actions.cancel') }}
      </button>
      <button type="button" class="adm-btn adm-btn--solid" data-test="adm-roles-submit" @click="onSubmit">
        {{ t('admin.users.rolesDialog.submit') }}
      </button>
    </template>
  </ElDialog>
</template>

<style scoped>
.adm-roles__help {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink-3);
  margin: 0 0 12px;
}
.adm-roles__group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.adm-roles__chip { display: inline-flex; align-items: center; gap: 6px; }
.adm-roles__code {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink);
  background: var(--paper-2);
  padding: 1px 6px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.adm-roles__name {
  font-family: var(--f-mono);
  font-size: var(--text-11);
  color: var(--ink-3);
}
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
.adm-btn--solid { background: var(--ink); color: var(--paper); }
.adm-btn:hover { background: var(--hilite); }
.adm-btn--solid:hover { background: var(--ink-3); }
.adm-btn:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
