<template>
  <div class="goods-detail" v-loading="loading">
    <el-page-header @back="$router.back()" :content="goods.title || '商品详情'"/>
    <el-divider/>
    <el-row :gutter="24">
      <el-col :span="10">
        <el-image :src="goods.coverUrl" fit="contain" class="cover"/>
      </el-col>
      <el-col :span="14">
        <h2>{{ goods.title }}</h2>
        <div class="price">¥{{ goods.price }}</div>
        <p class="desc">{{ goods.description }}</p>
        <el-tag v-if="goods.status === 'ON_SALE'" type="success">在售</el-tag>
        <el-tag v-else type="info">已下架</el-tag>
        <div class="model" v-if="goods.modelUrl">
          <el-link :href="goods.modelUrl" type="primary" target="_blank">下载模型文件</el-link>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getGoodsDetail } from '@/service/goods'

const route = useRoute()
const goods = ref({})
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    goods.value = (await getGoodsDetail(route.params.id)) || {}
  } catch (error) {
    // 响应拦截器已处理
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.goods-detail {
  padding: 24px;
}
.cover {
  width: 100%;
  height: 320px;
}
.price {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
  margin: 12px 0;
}
.desc {
  line-height: 1.8;
  color: #606266;
}
.model {
  margin-top: 16px;
}
</style>
