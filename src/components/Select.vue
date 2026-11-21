<script setup>
/**
 * Select.vue —— 原生手写下拉选择组件
 * 替代浏览器原生 <select>（原生弹层由 OS 渲染，样式不可控且观感突兀）。
 *
 * 用法：
 *   <Select v-model="val" :options="[{ label: '全部', value: '' }]" />
 *   options 兼容字符串数组（自动转为 { label, value }）。
 *
 * emits: update:modelValue / change
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  width: { type: Number, default: 0 } // 自定义宽度(px)，0 为自适应
})
const emit = defineEmits(['update:modelValue', 'change'])

// 兼容字符串数组与对象数组两种配置
const normalized = computed(() =>
  props.options.map(o =>
    typeof o === 'object' ? o : { label: String(o), value: o }
  )
)

const open = ref(false)
const rootRef = ref(null)

// 当前选中项的显示文本
const currentLabel = computed(() => {
  const hit = normalized.value.find(o => o.value === props.modelValue)
  return hit ? hit.label : ''
})

function toggle() { open.value = !open.value }

function pick(opt) {
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  open.value = false
}

// 点击组件外部时收起弹层
function onDocClick(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) open.value = false
}
// Esc 收起
function onKeydown(e) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="rootRef" class="ws-select" :class="{ 'is-open': open }" :style="width ? { width: width + 'px' } : null">
    <!-- 触发器 -->
    <button type="button" class="ws-trigger" @click="toggle">
      <span class="ws-text" :class="{ 'is-placeholder': !currentLabel }">
        {{ currentLabel || placeholder }}
      </span>
      <Icon name="chevron-down" :size="14" class="ws-arrow" />
    </button>

    <!-- 弹层选项列表 -->
    <transition name="ws-drop">
      <div v-if="open" class="ws-panel">
        <div
          v-for="opt in normalized"
          :key="opt.value"
          class="ws-option"
          :class="{ 'is-active': opt.value === modelValue }"
          @click="pick(opt)"
        >
          <span>{{ opt.label }}</span>
          <Icon v-if="opt.value === modelValue" name="check" :size="14" class="ws-check" />
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.ws-select {
  position: relative;
  display: inline-block;
  min-width: 120px;
  vertical-align: middle;
}
.ws-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #1d2129;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ws-trigger:hover { border-color: #94bfff; }
.ws-select.is-open .ws-trigger,
.ws-trigger:focus {
  outline: none;
  border-color: #165dff;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.08);
}
.ws-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-text.is-placeholder { color: #86909c; }
.ws-arrow {
  flex-shrink: 0;
  color: #86909c;
  transition: transform 0.15s;
}
.ws-select.is-open .ws-arrow { transform: rotate(180deg); color: #165dff; }

/* 弹层 */
.ws-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  max-height: 240px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(29, 33, 41, 0.1);
  padding: 4px;
  z-index: 2000;
}
.ws-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px;
  height: 32px;
  border-radius: 4px;
  font-size: 13px;
  color: #1d2129;
  cursor: pointer;
  white-space: nowrap;
}
.ws-option:hover { background: #f2f3f5; }
.ws-option.is-active {
  background: #f2f7ff;
  color: #165dff;
  font-weight: 500;
}
.ws-check { color: #165dff; flex-shrink: 0; }

/* 轻量展开动画 */
.ws-drop-enter-active, .ws-drop-leave-active { transition: opacity 0.12s, transform 0.12s; }
.ws-drop-enter-from, .ws-drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
