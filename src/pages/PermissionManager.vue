<script setup>
/**
 * PermissionManager.vue —— 系统权限管理（仅超级管理员可见）
 * 功能：角色管理，勾选配置每个角色可访问的功能模块。
 */
import { ref, computed } from 'vue'
import { store, canAccess } from '../store.js'
import { modules } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import Icon from '../components/Icon.vue'

const toast = useToast()
// 页面级角色校验：仅超级管理员可查看/修改权限，防止绕过菜单直接进入
const isAdmin = computed(() => store.currentUser?.role === 'superadmin' && canAccess('permission'))

// 直接编辑共享的 store.roles（响应式），侧边栏会实时反映权限变化；
// 此处演示「本地保存」，真实项目可在此处调用后端接口持久化。
function has(role, key) { return role.modules.includes(key) }
function toggle(role, key) {
  if (!isAdmin.value) return
  const i = role.modules.indexOf(key)
  if (i > -1) role.modules.splice(i, 1)
  else role.modules.push(key)
}
function save() {
  if (!isAdmin.value) { toast.error('无权修改权限配置'); return }
  toast.success('权限配置已保存')
}

// 点击回弹：动画结束移除 is-bounce，连续点击可重复触发
const saveBouncing = ref(false)
function clickSave() {
  saveBouncing.value = false
  requestAnimationFrame(() => { saveBouncing.value = true })
  save()
}
</script>

<template>
  <div class="wb-page">
    <template v-if="isAdmin">
    <div class="wb-page-header">
      <div class="wb-page-title">系统权限管理</div>
      <div class="wb-page-actions">
        <button
          class="wb-btn wb-btn-primary wb-btn-bounce"
          :class="{ 'is-bounce': saveBouncing }"
          @click="clickSave"
          @animationend="saveBouncing = false"
        >保存配置</button>
      </div>
    </div>

    <div class="wb-card">
      <div class="wb-card-title">角色 · 模块访问权限矩阵</div>
      <div class="wb-perm-table-wrap">
        <table class="wb-perm-table">
          <thead>
            <tr>
              <th class="wb-perm-role">角色</th>
              <th v-for="m in modules" :key="m.key" class="wb-perm-mod">
                <Icon :name="m.icon" :size="14" style="margin-right:4px;vertical-align:-2px" />{{ m.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in store.roles" :key="role.id">
              <td class="wb-perm-role">
                <div class="wb-perm-role-name">{{ role.name }}</div>
                <div class="wb-perm-role-desc">{{ role.desc }}</div>
              </td>
              <td v-for="m in modules" :key="m.key" class="wb-perm-cell">
                <input type="checkbox" :checked="has(role, m.key)" @change="toggle(role, m.key)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="wb-perm-tip">提示：勾选即授予该角色对应模块的访问权限，左侧导航会按角色实时过滤。</p>
    </div>
    </template>

    <!-- 越权访问兜底：非管理员进入本页时只显示无权限提示 -->
    <div v-else class="wb-card wb-no-permission">
      <Icon name="warning" :size="28" />
      <div class="wb-no-permission-title">无权访问</div>
      <p>系统权限管理仅超级管理员可查看与配置，请使用管理员账号登录。</p>
    </div>
  </div>
</template>

<style scoped>
.wb-perm-table-wrap { overflow-x: auto; }
.wb-perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.wb-perm-table th, .wb-perm-table td {
  border: 1px solid #e5e6eb;
  padding: 12px 10px;
  text-align: center;
}
.wb-perm-table thead th {
  background: #f7f8fa;
  color: #4e5969;
  font-weight: 600;
  white-space: nowrap;
}
.wb-perm-role { text-align: left !important; min-width: 200px; background: #fafbfc; }
.wb-perm-role-name { font-weight: 600; color: #1d2129; }
.wb-perm-role-desc { font-size: 12px; color: #86909c; margin-top: 4px; }
.wb-perm-mod { white-space: nowrap; }
.wb-perm-tip { margin-top: 16px; font-size: 12px; color: #86909c; }
/* 无权访问提示 */
.wb-no-permission { text-align: center; padding: 60px 20px; color: #86909c; }
.wb-no-permission-title { margin-top: 12px; font-size: 16px; font-weight: 600; color: #1d2129; }
.wb-no-permission p { margin: 8px 0 0; font-size: 13px; }
</style>
