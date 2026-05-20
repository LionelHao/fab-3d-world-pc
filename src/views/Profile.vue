<template>
  <div class="profile" v-loading="loading">
    <h2>创作者中心</h2>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="昵称">{{ info.nickname || '未设置' }}</el-descriptions-item>
      <el-descriptions-item label="用户名">{{ info.username || '-' }}</el-descriptions-item>
      <el-descriptions-item label="个性签名">{{ info.bio || '-' }}</el-descriptions-item>
      <el-descriptions-item label="用户ID">{{ info.userId || '-' }}</el-descriptions-item>
    </el-descriptions>

    <h3>我的模型库</h3>
    <el-row :gutter="16">
      <el-col :span="6" v-for="m in models" :key="m.modelId">
        <el-card shadow="hover">
          <el-image :src="m.imageUrl" fit="cover" class="model-cover"/>
          <div class="model-name">{{ m.name || '未命名模型' }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="!loading && models.length === 0" description="模型库为空"/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserInfo } from '@/service/user'
import { getModelLibrary } from '@/service/model'

const info = ref({})
const models = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    info.value = (await getUserInfo()) || {}
    models.value = (await getModelLibrary()) || []
  } catch (error) {
    // 响应拦截器已处理
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile {
  padding: 24px;
}
.model-cover {
  width: 100%;
  height: 140px;
}
.model-name {
  margin-top: 8px;
  font-weight: bold;
}
</style>
