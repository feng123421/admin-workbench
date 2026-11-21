<script setup>
/**
 * Toast.vue —— 全局轻提示容器
 * 监听 store.toasts，右上角展示成功/错误/信息提示，自动消失。
 */
import { store } from '../store.js'
import Icon from './Icon.vue'

const iconMap = {
  success: 'check',
  error: 'close',
  info: 'bell'
}
</script>

<template>
  <Teleport to="body">
    <div class="wb-toast-wrap">
      <div
        v-for="t in store.toasts"
        :key="t.id"
        class="wb-toast"
        :class="'wb-toast-' + t.type"
      >
        <Icon :name="iconMap[t.type] || 'bell'" :size="16" />
        <span>{{ t.message }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.wb-toast-wrap {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wb-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  max-width: 360px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #1d2129;
  border-left: 3px solid #165dff;
}
.wb-toast-success { border-left-color: #00b42a; color: #009a29; }
.wb-toast-error { border-left-color: #f53f3f; color: #cb2634; }
.wb-toast-info { border-left-color: #165dff; color: #165dff; }
.wb-toast :deep(.wb-icon) { color: inherit; }
</style>
