<script setup>
/**
 * ConfirmDialog.vue —— 全局二次确认框
 * 由 store.confirm 状态驱动（store.js 的 openConfirm / resolveConfirm）。
 * 删除等危险操作统一走这里做二次确认。
 */
import { store, resolveConfirm } from '../store.js'
import Icon from './Icon.vue'
</script>

<template>
  <Teleport to="body">
    <div v-if="store.confirm.open" class="wb-confirm-mask">
      <div class="wb-confirm">
        <div class="wb-confirm-icon">
          <Icon name="warning" :size="22" />
        </div>
        <div class="wb-confirm-main">
          <div class="wb-confirm-title">{{ store.confirm.title }}</div>
          <div v-if="store.confirm.message" class="wb-confirm-msg">{{ store.confirm.message }}</div>
        </div>
        <div class="wb-confirm-actions">
          <button class="wb-btn wb-btn-default" @click="resolveConfirm(false)">
            {{ store.confirm.cancelText }}
          </button>
          <button class="wb-btn wb-btn-danger" @click="resolveConfirm(true)">
            {{ store.confirm.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.wb-confirm-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.wb-confirm {
  background: #fff;
  width: 380px;
  max-width: 90vw;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  padding: 22px 22px 18px;
}
.wb-confirm-icon {
  color: #ff7d00;
  margin-bottom: 10px;
}
.wb-confirm-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
.wb-confirm-msg {
  margin-top: 8px;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.6;
}
.wb-confirm-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
