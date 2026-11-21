<script setup>
/**
 * FilterBar.vue —— 原生手写筛选条（配置驱动）
 * 通过 fields 配置生成筛选控件，支持 input 与 select 两种类型。
 *
 * fields 示例：
 * [
 *   { type: 'input',  key: 'keyword', placeholder: '搜索标题' },
 *   { type: 'select', key: 'status',  options: [{ label: '全部', value: '' }, ...] }
 * ]
 *
 * emits: change —— 筛选值对象（每次输入/选择都会触发）
 */
import { reactive, watch } from 'vue'
import Icon from './Icon.vue'
import Select from './Select.vue'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  // 是否显示重置按钮
  showReset: { type: Boolean, default: true }
})
const emit = defineEmits(['change'])

// 根据配置初始化筛选模型
const model = reactive({})
props.fields.forEach(f => {
  model[f.key] = f.default !== undefined ? f.default : ''
})

function emitChange() {
  emit('change', { ...model })
}

function reset() {
  props.fields.forEach(f => {
    model[f.key] = f.default !== undefined ? f.default : ''
  })
  emitChange()
}
</script>

<template>
  <div class="wb-filter-bar">
    <div v-for="f in fields" :key="f.key" class="wb-filter-item">
      <span v-if="f.label" class="wb-filter-label">{{ f.label }}</span>

      <!-- 文本输入 -->
      <div v-if="f.type === 'input'" class="wb-input-wrap">
        <Icon name="search" :size="14" class="wb-input-icon" />
        <input
          v-model="model[f.key]"
          class="wb-input"
          :placeholder="f.placeholder || '请输入'"
          @input="emitChange"
        />
      </div>

      <!-- 下拉选择（手写组件，样式统一可控） -->
      <Select
        v-else-if="f.type === 'select'"
        v-model="model[f.key]"
        :options="f.options"
        :placeholder="f.placeholder || '请选择'"
        @change="emitChange"
      />
    </div>

    <button v-if="showReset" class="wb-btn wb-btn-default" @click="reset">
      重置
    </button>
  </div>
</template>

<style scoped>
.wb-filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 16px;
}
.wb-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wb-filter-label {
  font-size: 13px;
  color: #4e5969;
}
.wb-input-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.wb-input-icon {
  position: absolute;
  left: 10px;
  color: #c9cdd4;
}
.wb-input {
  height: 32px;
  width: 200px;
  padding: 0 10px 0 30px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  color: #1d2129;
  background: #fff;
}
.wb-input:focus { border-color: #165dff; }
</style>
