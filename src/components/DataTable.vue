<script setup>
/**
 * DataTable.vue —— 原生手写表格组件
 * 特性：表头排序（点击循环 升序→降序→取消）、隔行底色、hover 高亮。
 * 通过具名插槽（插槽名 = 列 key）自定义单元格，默认展示原始值。
 *
 * props:
 *   columns  —— [{ key, label, sortable?, width?, align? }]
 *   data     —— 行数据数组
 *   rowKey   —— 行数据唯一字段名（默认 'id'）
 *   sortKey  —— 当前排序列 key（受控）
 *   sortOrder—— 当前排序方向 'asc' | 'desc' | ''（受控）
 * emits:
 *   sort-change —— { key, order }
 */
const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  sortKey: { type: String, default: '' },
  sortOrder: { type: String, default: '' }
})
const emit = defineEmits(['sort-change'])

// 点击可排序列头：asc -> desc -> 取消
function onSort(col) {
  if (!col.sortable) return
  let order = 'asc'
  if (props.sortKey === col.key) {
    if (props.sortOrder === 'asc') order = 'desc'
    else if (props.sortOrder === 'desc') order = ''
    else order = 'asc'
  }
  emit('sort-change', { key: col.key, order })
}

function sortIcon(col) {
  if (props.sortKey !== col.key) return '⇅'
  return props.sortOrder === 'asc' ? '↑' : props.sortOrder === 'desc' ? '↓' : '⇅'
}
</script>

<template>
  <div class="wb-table-wrap">
    <table class="wb-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="{ width: col.width ? col.width + 'px' : 'auto', textAlign: col.align || 'left' }"
            :class="{ sortable: col.sortable }"
            @click="onSort(col)"
          >
            <!-- 表头具名插槽（如 select-all 复选框）；未提供则展示文字 -->
            <slot :name="col.key + '-header'">
              <span class="th-label">{{ col.label }}</span>
              <span v-if="col.sortable" class="th-sort">{{ sortIcon(col) }}</span>
            </slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row[rowKey]">
          <td
            v-for="col in columns"
            :key="col.key"
            :style="{ textAlign: col.align || 'left' }"
          >
            <!-- 具名插槽自定义单元格；未提供则展示原始值 -->
            <slot :name="col.key" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="!data.length">
          <td :colspan="columns.length" class="wb-table-empty">暂无数据</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.wb-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #fff;
}
.wb-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #1d2129;
}
.wb-table thead th {
  background: #f7f8fa;
  color: #4e5969;
  font-weight: 600;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e6eb;
  white-space: nowrap;
  user-select: none;
}
.wb-table th.sortable { cursor: pointer; }
.wb-table th.sortable:hover { color: #165dff; }
.th-sort { margin-left: 4px; color: #c9cdd4; font-size: 12px; }
.wb-table tbody td {
  padding: 11px 14px;
  border-bottom: 1px solid #f2f3f5;
  white-space: nowrap;
}
/* 隔行底色 */
.wb-table tbody tr:nth-child(even) { background: #fafbfc; }
/* hover 高亮 */
.wb-table tbody tr:hover { background: #eef3ff; }
.wb-table tbody tr:last-child td { border-bottom: none; }
.wb-table-empty {
  text-align: center;
  color: #86909c;
  padding: 40px 0;
}
</style>
