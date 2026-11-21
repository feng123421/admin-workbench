<script setup>
/**
 * Breadcrumb.vue —— 面包屑
 * 展示「首页 / 当前模块」路径，数据来自 store.currentPage。
 */
import { computed } from 'vue'
import { store } from '../store.js'
import { modules } from '../mock.js'

const current = computed(() => modules.find(m => m.key === store.currentPage))
const label = computed(() => current.value?.label || '首页概览')
</script>

<template>
  <div class="wb-breadcrumb">
    <span class="wb-crumb-root">工作台</span>
    <span class="wb-crumb-sep">/</span>
    <span class="wb-crumb-current">{{ label }}</span>
  </div>
</template>

<style scoped>
.wb-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #86909c;
}
.wb-crumb-root { color: #86909c; }
.wb-crumb-sep { color: #c9cdd4; }
.wb-crumb-current { color: #1d2129; font-weight: 500; }
</style>
