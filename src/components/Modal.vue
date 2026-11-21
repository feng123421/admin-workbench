<script setup>
/**
 * Modal.vue —— 原生手写弹窗组件（无第三方库）
 * 通过 visible 控制显隐，title 设置标题，默认插槽放内容，footer 插槽放底部按钮。
 * 使用 Teleport 挂载到 body，避免被父级样式裁剪。
 */
import { watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [Number, String], default: 560 }
})
const emit = defineEmits(['close'])

// 弹窗打开时锁定背景滚动
watch(() => props.visible, v => {
  document.body.style.overflow = v ? 'hidden' : ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="wb-modal-mask" @click.self="emit('close')">
      <div class="wb-modal" :style="{ width: typeof width === 'number' ? width + 'px' : width }">
        <div class="wb-modal-header">
          <span class="wb-modal-title">{{ title }}</span>
          <button class="wb-modal-close" @click="emit('close')" aria-label="关闭">
            <Icon name="close" :size="18" />
          </button>
        </div>
        <div class="wb-modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="wb-modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.wb-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8vh;
  z-index: 1000;
}
.wb-modal {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  max-width: 92vw;
  max-height: 84vh;
  display: flex;
  flex-direction: column;
}
.wb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e6eb;
}
.wb-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
.wb-modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #86909c;
  display: flex;
  padding: 4px;
  border-radius: 6px;
}
.wb-modal-close:hover { background: #f2f3f5; color: #1d2129; }
.wb-modal-body {
  padding: 20px;
  overflow-y: auto;
}
.wb-modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e6eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
