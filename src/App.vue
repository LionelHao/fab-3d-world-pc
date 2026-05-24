<script setup>
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import { useLocaleStore } from '@/stores/locale'

const localeStore = useLocaleStore()
const elLocale = computed(() => localeStore.elLocale)
</script>

<template>
  <el-config-provider :locale="elLocale">
    <div class="app-container">
      <router-view />
    </div>
  </el-config-provider>
</template>

<style>
body {
  margin: 0;
}

.app-container {
  min-height: 100vh;
}
</style>
