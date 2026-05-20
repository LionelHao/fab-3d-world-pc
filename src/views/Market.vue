<template>
  <div class="market">
    <h2>模型市场</h2>
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索模型商品"
        clearable
        style="width: 280px"
        @keyup.enter="onSearch"
      />
      <el-button type="primary" @click="onSearch">搜索</el-button>
      <el-select v-model="categoryId" placeholder="全部分类" clearable @change="loadGoods" style="width: 160px">
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id"/>
      </el-select>
    </div>
    <el-row :gutter="16" v-loading="loading">
      <el-col :span="6" v-for="g in goods" :key="g.id">
        <el-card class="goods-card" shadow="hover" @click="goDetail(g.id)">
          <el-image :src="g.coverUrl" fit="cover" class="cover"/>
          <div class="title">{{ g.title }}</div>
          <div class="price">¥{{ g.price }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="!loading && goods.length === 0" description="暂无商品"/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getGoodsList, getCategories, searchGoods } from '@/service/goods'

const router = useRouter()
const goods = ref([])
const categories = ref([])
const keyword = ref('')
const categoryId = ref(null)
const loading = ref(false)

const goDetail = (id) => router.push(`/goods/${id}`)

const loadGoods = async () => {
  loading.value = true
  try {
    goods.value = (await getGoodsList(categoryId.value)) || []
  } finally {
    loading.value = false
  }
}

const onSearch = async () => {
  if (!keyword.value.trim()) {
    loadGoods()
    return
  }
  loading.value = true
  try {
    goods.value = (await searchGoods(keyword.value.trim())) || []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = (await getCategories()) || []
  } catch (error) { /* 忽略 */ }
  loadGoods()
})
</script>

<style scoped>
.market {
  padding: 24px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.goods-card {
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
}
.price {
  color: #f56c6c;
  font-weight: bold;
}
</style>
