<script setup>
/**
 * App.vue —— 应用入口
 * 职责：
 *  1. 登录状态控制（未登录展示 Login，已登录展示后台布局）
 *  2. 页面切换（原生组件切换，不依赖 vue-router）
 *  3. 统一挂载 Toast 与全局确认框
 */
import { computed, markRaw, watch } from 'vue'
import { store, canAccess } from './store.js'

import Login from './pages/Login.vue'
import Dashboard from './pages/Dashboard.vue'
import TaskList from './pages/TaskList.vue'
import OrderList from './pages/OrderList.vue'
import ProjectList from './pages/ProjectList.vue'
import CustomerList from './pages/CustomerList.vue'
import NotificationCenter from './pages/NotificationCenter.vue'
import ResourceCenter from './pages/ResourceCenter.vue'
import PermissionManager from './pages/PermissionManager.vue'
import PersonalSettings from './pages/PersonalSettings.vue'

import SideNav from './components/SideNav.vue'
import TopBar from './components/TopBar.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

// 页面 key -> 组件 映射（原生路由表）
const pageMap = {
  dashboard: markRaw(Dashboard),
  task: markRaw(TaskList),
  order: markRaw(OrderList),
  project: markRaw(ProjectList),
  customer: markRaw(CustomerList),
  notification: markRaw(NotificationCenter),
  resource: markRaw(ResourceCenter),
  permission: markRaw(PermissionManager),
  settings: markRaw(PersonalSettings)
}

const loggedIn = computed(() => !!store.currentUser)

// 当前页面组件：同时做权限校验，越权一律渲染首页（防止绕过 navigate 直接改 currentPage）
const currentComp = computed(() =>
  canAccess(store.currentPage) ? (pageMap[store.currentPage] || pageMap.dashboard) : pageMap.dashboard
)

// 权限守卫兜底：页面 key / 登录用户 / 角色权限任一变化时校正越权状态
watch(
  () => [store.currentPage, store.currentUser, store.roles],
  () => {
    if (store.currentUser && !canAccess(store.currentPage)) store.currentPage = 'dashboard'
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <Login v-if="!loggedIn" />

  <div v-else class="wb-app">
    <SideNav />
    <div class="wb-main">
      <TopBar />
      <div class="wb-content">
        <Breadcrumb />
        <!-- key 绑定页面 key，切换时强制重挂载（图表等副作用可正确初始化/销毁） -->
        <component :is="currentComp" :key="store.currentPage" />
      </div>
    </div>
  </div>

  <!-- 全局组件 -->
  <Toast />
  <ConfirmDialog />
</template>

<style scoped>
.wb-app {
  display: flex;
  min-height: 100vh;
}
.wb-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.wb-content {
  flex: 1;
  overflow-y: auto;
}
</style>
