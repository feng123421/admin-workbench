<script setup>
/**
 * Pagination.vue —— 原生手写分页组件
 * props: total(总条数), pageSize(每页条数), current(当前页)
 * emits: change —— 新的页码
 */
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  total: { type: Number, required: true },
  pageSize: { type: Number, default: 8 },
  current: { type: Number, default: 1 }
})
const emit = defineEmits(['change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// 计算需要展示的页码（最多 7 个，超出显示省略号）
const pages = computed(() => {
  const tp = totalPages.value
  const cur = props.current
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
  const arr = [1]
  const start = Math.max(2, cur - 1)
  const end = Math.min(tp - 1, cur + 1)
  if (start > 2) arr.push('...')
  for (let i = start; i <= end; i++) arr.push(i)
  if (end < tp - 1) arr.push('...')
  arr.push(tp)
  return arr
})

function go(p) {
  if (p === '...' || p < 1 || p > totalPages.value || p === props.current) return
  emit('change', p)
}
</script>

<template>
  <div class="wb-pagination" v-if="total > 0">
    <button class="wb-page-btn" :disabled="current <= 1" @click="go(current - 1)">
      <Icon name="chevron-right" :size="14" style="transform: rotate(180deg)" />
    </button>
    <button
      v-for="p in pages"
      :key="p"
      class="wb-page-btn"
      :class="{ active: p === current, dots: p === '...' }"
      :disabled="p === '...'"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button class="wb-page-btn" :disabled="current >= totalPages" @click="go(current + 1)">
      <Icon name="chevron-right" :size="14" />
    </button>
    <span class="wb-page-info">共 {{ total }} 条 / {{ totalPages }} 页</span>
  </div>
</template>

<style scoped>
.wb-pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.wb-page-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #e5e6eb;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  color: #4e5969;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.wb-page-btn:hover:not(:disabled):not(.dots) {
  border-color: #165dff;
  color: #165dff;
}
.wb-page-btn.active {
  background: #165dff;
  border-color: #165dff;
  color: #fff;
}
.wb-page-btn:disabled { cursor: not-allowed; color: #c9cdd4; }
.wb-page-btn.dots { border: none; background: transparent; cursor: default; }
.wb-page-info {
  margin-left: 10px;
  font-size: 12px;
  color: #86909c;
}
</style>
