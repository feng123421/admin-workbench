<script setup>
/**
 * TopBar.vue —— 顶部栏
 * 包含：全局模糊搜索（任务/订单/客户/项目）、通知中心入口（带未读角标）、用户信息菜单。
 */
import { ref, computed, watch } from 'vue'
import { store, navigate, logout, markNotificationRead, markAllNotificationsRead } from '../store.js'
import { tasks, orders, customers, projects, roleLabelMap } from '../mock.js'
import Icon from './Icon.vue'

const keyword = ref('')
const searchOpen = ref(false)
const notifOpen = ref(false)
const userOpen = ref(false)

// 关闭所有下拉
function closeAll() {
  searchOpen.value = false
  notifOpen.value = false
  userOpen.value = false
}

// 当前角色可访问的模块 key（与侧边栏同源，保证权限一致）
const accessibleKeys = computed(() => {
  const role = store.roles.find(r => r.id === store.currentUser?.role)
  return role ? role.modules : []
})

// 全局搜索：仅检索当前角色有权访问的模块，避免跨角色数据泄露
const searchResults = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  const keys = accessibleKeys.value
  const list = []

  if (keys.includes('task')) {
    tasks.forEach(t => {
      if (t.title.toLowerCase().includes(kw) || t.owner.toLowerCase().includes(kw))
        list.push({ type: '任务', label: t.title, sub: t.owner + ' · ' + t.status, page: 'task' })
    })
  }
  if (keys.includes('order')) {
    orders.forEach(o => {
      if (o.id.toLowerCase().includes(kw) || o.customer.toLowerCase().includes(kw))
        list.push({ type: '订单', label: o.id + ' ' + o.customer, sub: '¥' + o.amount, page: 'order' })
    })
  }
  if (keys.includes('customer')) {
    customers.forEach(c => {
      if (c.name.toLowerCase().includes(kw) || c.contact.toLowerCase().includes(kw))
        list.push({ type: '客户', label: c.name, sub: c.contact + ' · ' + c.dealStatus, page: 'customer' })
    })
  }
  if (keys.includes('project')) {
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(kw) || p.owner.toLowerCase().includes(kw))
        list.push({ type: '项目', label: p.name, sub: p.owner + ' · 进度' + p.progress + '%', page: 'project' })
    })
  }
  return list.slice(0, 8)
})

const unread = computed(() => store.notifications.filter(n => !n.read).length)
const roleName = computed(() => roleLabelMap[store.currentUser?.role] || '')

function goSearchResult(r) {
  navigate(r.page)
  closeAll()
  keyword.value = ''
}

function openNotif() {
  notifOpen.value = !notifOpen.value
  userOpen.value = false
  searchOpen.value = false
}
function clickNotif(n) {
  markNotificationRead(n.id)
  navigate(n.relatedPage)
  closeAll()
}
function allRead() {
  markAllNotificationsRead()
}
function viewAllNotif() {
  navigate('notification')
  closeAll()
}

function openUser() {
  userOpen.value = !userOpen.value
  notifOpen.value = false
  searchOpen.value = false
}
function goSettings() {
  navigate('settings')
  closeAll()
}
function doLogout() {
  logout()
  closeAll()
}

// 输入时自动展开搜索结果面板
watch(keyword, v => { searchOpen.value = v.trim().length > 0 })
</script>

<template>
  <header class="wb-topbar">
    <!-- 全局搜索 -->
    <div class="wb-search" @click.stop>
      <div class="wb-search-input-wrap">
        <Icon name="search" :size="16" class="wb-search-icon" />
        <input
          v-model="keyword"
          class="wb-search-input"
          placeholder="搜索任务、订单、客户、项目…"
          @focus="searchOpen = keyword.trim().length > 0"
        />
      </div>
      <div v-if="searchOpen && keyword.trim()" class="wb-dropdown wb-search-panel">
        <div v-if="!searchResults.length" class="wb-dropdown-empty">未找到匹配结果</div>
        <div
          v-for="(r, i) in searchResults"
          :key="i"
          class="wb-search-item"
          @click="goSearchResult(r)"
        >
          <span class="wb-tag">{{ r.type }}</span>
          <div class="wb-search-item-main">
            <div class="wb-search-item-label">{{ r.label }}</div>
            <div class="wb-search-item-sub">{{ r.sub }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="wb-topbar-right">
      <!-- 通知 -->
      <div class="wb-notif" @click.stop>
        <button class="wb-icon-btn" @click="openNotif" aria-label="通知">
          <Icon name="bell" :size="20" />
          <span v-if="unread" class="wb-badge">{{ unread > 99 ? '99+' : unread }}</span>
        </button>
        <div v-if="notifOpen" class="wb-dropdown wb-notif-panel">
          <div class="wb-dropdown-head">
            <span>通知中心</span>
            <button class="wb-link" @click="allRead">全部已读</button>
          </div>
          <div class="wb-notif-list">
            <div
              v-for="n in store.notifications.slice(0, 6)"
              :key="n.id"
              class="wb-notif-item"
              :class="{ unread: !n.read }"
              @click="clickNotif(n)"
            >
              <span class="wb-dot" v-if="!n.read"></span>
              <div class="wb-notif-item-main">
                <div class="wb-notif-title">{{ n.title }}</div>
                <div class="wb-notif-content">{{ n.content }}</div>
                <div class="wb-notif-time">{{ n.time }}</div>
              </div>
            </div>
          </div>
          <button class="wb-dropdown-foot" @click="viewAllNotif">查看全部通知</button>
        </div>
      </div>

      <!-- 用户信息 -->
      <div class="wb-user" @click.stop>
        <button class="wb-user-btn" @click="openUser">
          <span class="wb-avatar">{{ store.currentUser?.name?.charAt(0) }}</span>
          <div class="wb-user-meta">
            <span class="wb-user-name">{{ store.currentUser?.name }}</span>
            <span class="wb-user-role">{{ roleName }}</span>
          </div>
        </button>
        <div v-if="userOpen" class="wb-dropdown wb-user-panel">
          <div class="wb-user-panel-head">
            <span class="wb-avatar lg">{{ store.currentUser?.name?.charAt(0) }}</span>
            <div>
              <div class="wb-user-name">{{ store.currentUser?.name }}</div>
              <div class="wb-user-role">{{ roleName }}</div>
            </div>
          </div>
          <div class="wb-user-panel-menu">
            <div class="wb-menu-row" @click="goSettings">
              <Icon name="settings" :size="16" /><span>个人设置</span>
            </div>
            <div class="wb-menu-row danger" @click="doLogout">
              <Icon name="logout" :size="16" /><span>退出登录</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 点击空白处关闭下拉 -->
    <div v-if="searchOpen || notifOpen || userOpen" class="wb-overlay" @click="closeAll"></div>
  </header>
</template>

<style scoped>
.wb-topbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 50;
}
.wb-search { flex: 1; max-width: 420px; position: relative; }
.wb-search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.wb-search-icon { position: absolute; left: 12px; color: #c9cdd4; }
.wb-search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 36px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #f7f8fa;
  color: #1d2129;
}
.wb-search-input:focus { border-color: #165dff; background: #fff; }

.wb-topbar-right { display: flex; align-items: center; gap: 8px; }
.wb-icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #4e5969;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wb-icon-btn:hover { background: #f2f3f5; color: #165dff; }
.wb-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #f53f3f;
  color: #fff;
  font-size: 11px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wb-user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}
.wb-user-btn:hover { background: #f2f3f5; }
.wb-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #165dff;
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.wb-avatar.lg { width: 40px; height: 40px; font-size: 16px; }
.wb-user-meta { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.3; }
.wb-user-name { font-size: 13px; color: #1d2129; font-weight: 500; }
.wb-user-role { font-size: 12px; color: #86909c; }

/* 下拉面板通用 */
.wb-dropdown {
  position: absolute;
  top: 46px;
  right: 0;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  z-index: 60;
  overflow: hidden;
}
.wb-notif-panel { width: 340px; }
.wb-user-panel { width: 220px; }
.wb-search-panel { left: 0; right: auto; width: 100%; max-width: 420px; }

.wb-dropdown-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}
.wb-link { border: none; background: transparent; color: #165dff; cursor: pointer; font-size: 13px; }
.wb-dropdown-foot {
  width: 100%;
  border: none;
  border-top: 1px solid #f2f3f5;
  background: #fff;
  padding: 12px;
  cursor: pointer;
  color: #165dff;
  font-size: 13px;
}
.wb-dropdown-foot:hover { background: #f7f8fa; }

.wb-notif-list { max-height: 320px; overflow-y: auto; }
.wb-notif-item {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f7f8fa;
  cursor: pointer;
}
.wb-notif-item:hover { background: #f7f8fa; }
.wb-dot { width: 6px; height: 6px; border-radius: 50%; background: #165dff; margin-top: 6px; flex-shrink: 0; }
.wb-notif-item-main { flex: 1; }
.wb-notif-title { font-size: 13px; color: #1d2129; font-weight: 500; }
.wb-notif-content { font-size: 12px; color: #86909c; margin-top: 2px; line-height: 1.5; }
.wb-notif-time { font-size: 11px; color: #c9cdd4; margin-top: 4px; }

.wb-user-panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid #f2f3f5;
}
.wb-user-panel-menu { padding: 6px; }
.wb-menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
}
.wb-menu-row:hover { background: #f2f3f5; }
.wb-menu-row.danger { color: #f53f3f; }

.wb-search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f7f8fa;
}
.wb-search-item:hover { background: #f7f8fa; }
.wb-search-item-main { flex: 1; }
.wb-search-item-label { font-size: 13px; color: #1d2129; }
.wb-search-item-sub { font-size: 12px; color: #86909c; margin-top: 2px; }
.wb-dropdown-empty { padding: 20px; text-align: center; color: #86909c; font-size: 13px; }

.wb-tag {
  font-size: 11px;
  color: #165dff;
  background: #e8f0ff;
  border-radius: 4px;
  padding: 2px 6px;
  flex-shrink: 0;
}
.wb-overlay { position: fixed; inset: 0; z-index: 55; }
</style>
