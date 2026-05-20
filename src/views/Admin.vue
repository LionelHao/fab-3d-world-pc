<template>
  <div class="admin" v-loading="loading">
    <h2>运营后台</h2>
    <el-tabs v-model="tab" @tab-change="onTabChange">
      <!-- 数据看板 -->
      <el-tab-pane label="数据看板" name="dashboard">
        <el-row :gutter="16">
          <el-col :span="6"><el-statistic title="用户数" :value="stats.userCount || 0"/></el-col>
          <el-col :span="6"><el-statistic title="帖子数" :value="stats.postCount || 0"/></el-col>
          <el-col :span="6"><el-statistic title="商品数" :value="stats.goodsCount || 0"/></el-col>
          <el-col :span="6"><el-statistic title="订单数" :value="stats.orderCount || 0"/></el-col>
        </el-row>
      </el-tab-pane>

      <!-- 帖子管理 -->
      <el-tab-pane label="帖子管理" name="posts">
        <el-table :data="posts">
          <el-table-column prop="id" label="ID" width="80"/>
          <el-table-column prop="title" label="标题"/>
          <el-table-column prop="status" label="状态" width="120"/>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="onOffline(row.id)">下架</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <el-table :data="users">
          <el-table-column prop="id" label="ID" width="80"/>
          <el-table-column prop="username" label="用户名"/>
          <el-table-column prop="status" label="状态" width="100"/>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="onBan(row.id)">封禁</el-button>
              <el-button size="small" @click="onUnban(row.id)">解禁</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 订单查询 -->
      <el-tab-pane label="订单查询" name="orders">
        <el-table :data="orders">
          <el-table-column prop="orderNo" label="订单号"/>
          <el-table-column prop="totalAmount" label="金额" width="120"/>
          <el-table-column prop="status" label="状态" width="140"/>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDashboard, listPosts, offlinePost,
  listUsers, banUser, unbanUser, listOrders
} from '@/service/admin'

const tab = ref('dashboard')
const loading = ref(false)
const stats = ref({})
const posts = ref([])
const users = ref([])
const orders = ref([])

const runLoad = async (fn) => {
  loading.value = true
  try {
    await fn()
  } catch (error) {
    // 响应拦截器已处理
  } finally {
    loading.value = false
  }
}

const onTabChange = (name) => {
  if (name === 'dashboard') runLoad(async () => { stats.value = (await getDashboard()) || {} })
  if (name === 'posts') runLoad(async () => { posts.value = (await listPosts()) || [] })
  if (name === 'users') runLoad(async () => { users.value = (await listUsers()) || [] })
  if (name === 'orders') runLoad(async () => { orders.value = (await listOrders()) || [] })
}

const onOffline = async (id) => {
  await offlinePost(id)
  ElMessage.success('已下架')
  onTabChange('posts')
}
const onBan = async (id) => {
  await banUser(id)
  ElMessage.success('已封禁')
  onTabChange('users')
}
const onUnban = async (id) => {
  await unbanUser(id)
  ElMessage.success('已解禁')
  onTabChange('users')
}

onMounted(() => onTabChange('dashboard'))
</script>

<style scoped>
.admin {
  padding: 24px;
}
</style>
