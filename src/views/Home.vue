<template>
  <div class="home">
    <h2>社区作品</h2>
    <el-row :gutter="16" v-loading="loading">
      <el-col :span="6" v-for="p in posts" :key="p.postId">
        <el-card class="post-card" shadow="hover" @click="goDetail(p.postId)">
          <el-image :src="p.coverUrl" fit="cover" class="cover"/>
          <div class="title">{{ p.title }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="!loading && posts.length === 0" description="暂无作品"/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPosts } from '@/service/content'

const router = useRouter()
const posts = ref([])
const loading = ref(false)

const goDetail = (id) => router.push(`/post/${id}`)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getPosts(12, 1)
    posts.value = res?.postCoverInfoList || []
  } catch (error) {
    // 响应拦截器已处理
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home {
  padding: 24px;
}
.post-card {
  margin-bottom: 16px;
  cursor: pointer;
}
.cover {
  width: 100%;
  height: 180px;
}
.title {
  margin-top: 8px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
