<template>
  <div class="post-detail" v-loading="loading">
    <el-page-header @back="$router.back()" :content="post.title || '帖子详情'"/>
    <el-divider/>
    <el-carousel v-if="post.imageUrlList && post.imageUrlList.length" height="360px">
      <el-carousel-item v-for="(url, i) in post.imageUrlList" :key="i">
        <el-image :src="url" fit="contain" style="width:100%;height:100%"/>
      </el-carousel-item>
    </el-carousel>
    <h2>{{ post.title }}</h2>
    <div class="meta">
      <span>👍 {{ post.likeCount || 0 }}</span>
      <span>⭐ {{ post.collectCount || 0 }}</span>
      <span>{{ post.createTime }}</span>
    </div>
    <p class="content">{{ post.content }}</p>
    <el-divider/>
    <div v-if="post.modelUrlList && post.modelUrlList.length">
      <h3>模型文件</h3>
      <el-link v-for="(url, i) in post.modelUrlList" :key="i" :href="url" type="primary" target="_blank">
        模型 {{ i + 1 }}
      </el-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPostDetail } from '@/service/content'

const route = useRoute()
const post = ref({})
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    post.value = (await getPostDetail(route.params.id)) || {}
  } catch (error) {
    // 响应拦截器已处理
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.post-detail {
  padding: 24px;
}
.meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 13px;
}
.content {
  line-height: 1.8;
}
</style>
