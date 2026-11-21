<script setup>
/**
 * OrderList.vue —— 订单管理
 * 功能：筛选、排序（金额/时间）、分页、导出 CSV（模拟）。
 */
import { ref, reactive, computed } from 'vue'
import { orders as mockOrders, deepClone } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import FilterBar from '../components/FilterBar.vue'
import Icon from '../components/Icon.vue'

const toast = useToast()
const orderList = ref(deepClone(mockOrders))

const filters = reactive({ keyword: '', status: '', owner: '' })
const filterFields = [
  { type: 'input', key: 'keyword', placeholder: '搜索订单号/客户' },
  { type: 'select', key: 'status', options: [
    { label: '全部状态', value: '' }, { label: '待付款', value: '待付款' }, { label: '已付款', value: '已付款' },
    { label: '已发货', value: '已发货' }, { label: '已完成', value: '已完成' }, { label: '已取消', value: '已取消' }
  ] },
  { type: 'select', key: 'owner', options: [
    { label: '全部负责人', value: '' }, { label: '王销售', value: '王销售' }
  ] }
]

const sortKey = ref('')
const sortOrder = ref('')
const pageSize = 8
const currentPage = ref(1)

const columns = [
  { key: 'id', label: '订单编号', width: 130 },
  { key: 'customer', label: '客户' },
  { key: 'amount', label: '金额', width: 120, sortable: true, align: 'right' },
  { key: 'createTime', label: '下单时间', width: 160, sortable: true },
  { key: 'status', label: '状态', width: 90 },
  { key: 'owner', label: '负责人', width: 90 }
]

const filtered = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  let list = orderList.value.filter(o => {
    if (kw && !(o.id.toLowerCase().includes(kw) || o.customer.toLowerCase().includes(kw))) return false
    if (filters.status && o.status !== filters.status) return false
    if (filters.owner && o.owner !== filters.owner) return false
    return true
  })
  if (sortKey.value && sortOrder.value) {
    list = [...list].sort((a, b) => {
      let av = a[sortKey.value], bv = b[sortKey.value]
      if (av < bv) return sortOrder.value === 'asc' ? -1 : 1
      if (av > bv) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }
  return list
})

const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
const total = computed(() => filtered.value.length)

function onPageChange(p) { currentPage.value = p }
function onSortChange({ key, order }) { sortKey.value = key; sortOrder.value = order; currentPage.value = 1 }

/**
 * CSV 单元格转义：
 *  1. 双引号包裹并把内部 " 转义为 ""（原有逻辑）
 *  2. 防御公式注入：以 = + - @ 或制表/回车开头的值前置单引号，
 *     避免 Excel/WPS 打开时把单元格当作公式执行（如 =HYPERLINK 外带数据）
 */
function csvCell(v) {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return '"' + s.replace(/"/g, '""') + '"'
}

// 导出 CSV（模拟下载）
function exportCsv() {
  if (!filtered.value.length) { toast.error('没有可导出的数据'); return }
  const headers = ['订单编号', '客户', '金额', '下单时间', '状态', '负责人']
  const rows = filtered.value.map(o => [o.id, o.customer, o.amount, o.createTime, o.status, o.owner])
  // 加 BOM 头，保证 Excel 正确识别中文
  let csv = '\ufeff' + headers.map(csvCell).join(',') + '\n'
  rows.forEach(r => {
    csv += r.map(csvCell).join(',') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '订单数据_' + new Date().toISOString().slice(0, 10) + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 延迟回收，避免部分浏览器下载尚未启动就释放 Blob URL
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast.success('CSV 已导出')
}

function statusClass(s) {
  return {
    待付款: 'wb-tag-warning', 已付款: 'wb-tag-primary', 已发货: 'wb-tag-default',
    已完成: 'wb-tag-success', 已取消: 'wb-tag-danger'
  }[s] || 'wb-tag-default'
}
function fmtAmount(v) { return '¥' + v.toLocaleString('zh-CN') }
</script>

<template>
  <div class="wb-page">
    <div class="wb-page-header">
      <div class="wb-page-title">订单管理</div>
      <div class="wb-page-actions">
        <button class="wb-btn wb-btn-default" @click="exportCsv">
          <Icon name="download" :size="14" /> 导出 CSV
        </button>
      </div>
    </div>

    <FilterBar :fields="filterFields" @change="Object.assign(filters, $event); currentPage = 1" />

    <DataTable :columns="columns" :data="paged" :sort-key="sortKey" :sort-order="sortOrder" @sort-change="onSortChange">
      <template #amount="{ value }"><b>{{ fmtAmount(value) }}</b></template>
      <template #status="{ value }"><span class="wb-tag" :class="statusClass(value)">{{ value }}</span></template>
    </DataTable>

    <Pagination :total="total" :page-size="pageSize" :current="currentPage" @change="onPageChange" />
  </div>
</template>
