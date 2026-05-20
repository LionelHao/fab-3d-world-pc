<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="logo">Fab 3D World</div>
      <el-menu mode="horizontal" :ellipsis="false" router :default-active="$route.path">
        <el-menu-item index="/home">首页</el-menu-item>
        <el-menu-item index="/market">模型市场</el-menu-item>
        <el-menu-item v-if="userStore.isLoggedIn" index="/profile">创作者中心</el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/admin">运营后台</el-menu-item>
      </el-menu>
      <div class="header-right">
        <span v-if="userStore.isLoggedIn">{{ userStore.userInfo?.nickname || '我' }}</span>
        <router-link v-else to="/login">登录</router-link>
      </div>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style>
body {
  margin: 0;
}
.app-container {
  min-height: 100vh;
}
.app-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  margin-right: 32px;
  color: #409eff;
}
.app-header .el-menu {
  flex: 1;
  border-bottom: none;
}
.header-right {
  color: #606266;
}
</style>
