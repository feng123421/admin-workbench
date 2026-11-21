<script setup>
/**
 * NotificationCenter.vue —— 通知中心
 * 功能：消息列表（按类型区分）、标记已读、全部已读、点击跳转相关业务页。
 */
import { computed } from 'vue'
import { store, markNotificationRead, markAllNotificationsRead, navigate } from '../store.js'
import { useToast } from '../composables/useToast.js'
import Icon from '../components/Icon.vue'

const toast = useToast()
const list = computed(() => store.notifications)

const typeClass = {
  系统: 'wb-tag-primary', 任务: 'wb-tag-default', 订单: 'wb-tag-success',
  客户: 'wb-tag-warning', 审批: 'wb-tag-danger', 项目: 'wb-tag-warning'
}

function onClick(n) {
  markNotificationRead(n.id)
  navigate(n.relatedPage)
}
function onMark(n) {
  markNotificationRead(n.id)
  toast.success('已标记为已读')
}
function onAll() {
  markAllNotificationsRead()
  toast.success('已全部标记为已读')
}
</script>

<template>
  <div class="wb-page">
    <div class="wb-page-header">
      <div class="wb-page-title">通知中心</div>
      <div class="wb-page-actions">
        <button class="wb-btn wb-btn-default" @click="onAll">
          <Icon name="check" :size="14" /> 全部已读
        </button>
      </div>
    </div>

    <div class="wb-card wb-notif-list">
      <div
        v-for="n in list"
        :key="n.id"
        class="wb-notif-row"
        :class="{ unread: !n.read }"
        @click="onClick(n)"
      >
        <span class="wb-dot" v-if="!n.read"></span>
        <span class="wb-tag" :class="typeClass[n.type] || 'wb-tag-default'">{{ n.type }}</span>
        <div class="wb-notif-row-main">
          <div class="wb-notif-row-title">{{ n.title }}</div>
          <div class="wb-notif-row-content">{{ n.content }}</div>
        </div>
        <div class="wb-notif-row-time">{{ n.time }}</div>
        <button
          v-if="!n.read"
          class="wb-btn wb-btn-sm wb-btn-default"
          @click.stop="onMark(n)"
        >标为已读</button>
      </div>
      <div v-if="!list.length" class="wb-empty">暂无通知</div>
    </div>
  </div>
</template>

<style scoped>
.wb-notif-list { padding: 8px 20px; }
.wb-notif-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
  position: relative;
}
.wb-notif-row:last-child { border-bottom: none; }
.wb-notif-row:hover { background: #f7faff; }
.wb-notif-row.unread { background: #f7faff; }
.wb-dot { width: 7px; height: 7px; border-radius: 50%; background: #165dff; flex-shrink: 0; }
.wb-notif-row-main { flex: 1; min-width: 0; }
.wb-notif-row-title { font-size: 14px; color: #1d2129; font-weight: 500; }
.wb-notif-row-content { font-size: 13px; color: #86909c; margin-top: 3px; }
.wb-notif-row-time { font-size: 12px; color: #c9cdd4; white-space: nowrap; }
.wb-empty { text-align: center; color: #86909c; padding: 40px 0; }
</style>
