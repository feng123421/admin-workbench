<script setup>
/**
 * SideNav.vue —— 左侧固定导航栏
 * 根据当前登录角色的「可访问模块」动态渲染菜单（权限隔离）。
 */
import { computed } from 'vue'
import { store, navigate } from '../store.js'
import { modules } from '../mock.js'
import Icon from './Icon.vue'

// 当前角色可访问的模块 key 集合（读取共享的响应式 roles，权限修改后实时生效）
const accessibleKeys = computed(() => {
  const role = store.roles.find(r => r.id === store.currentUser?.role)
  return role ? role.modules : []
})

// 过滤后的菜单项
const menuItems = computed(() =>
  modules.filter(m => accessibleKeys.value.includes(m.key))
)

function onClick(key) {
  navigate(key)
}
</script>

<template>
  <aside class="wb-sidenav">
    <div class="wb-logo">
      <span class="wb-logo-mark">W</span>
      <span class="wb-logo-text">企业工作台</span>
    </div>
    <nav class="wb-menu">
      <div
        v-for="item in menuItems"
        :key="item.key"
        class="wb-menu-item"
        :class="{ active: store.currentPage === item.key }"
        @click="onClick(item.key)"
      >
        <Icon :name="item.icon" :size="18" />
        <span class="wb-menu-label">{{ item.label }}</span>
      </div>
    </nav>
    <div class="wb-sidenav-footer">
      <span>v1.0.0 · 内部系统</span>
    </div>
  </aside>
</template>

<style scoped>
.wb-sidenav {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e6eb;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}
.wb-logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid #f2f3f5;
}
.wb-logo-mark {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #165dff;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.wb-logo-text { font-size: 15px; font-weight: 600; color: #1d2129; }
.wb-menu {
  flex: 1;
  padding: 12px 12px;
  overflow-y: auto;
}
.wb-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 12px;
  border-radius: 8px;
  color: #4e5969;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 4px;
  transition: background 0.15s, color 0.15s;
}
.wb-menu-item:hover { background: #f2f3f5; color: #1d2129; }
.wb-menu-item.active {
  background: #e8f0ff;
  color: #165dff;
  font-weight: 600;
}
.wb-menu-label { white-space: nowrap; }
.wb-sidenav-footer {
  padding: 14px 20px;
  font-size: 12px;
  color: #c9cdd4;
  border-top: 1px solid #f2f3f5;
}
</style>
