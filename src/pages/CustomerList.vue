<script setup>
/**
 * CustomerList.vue —— 客户管理
 * 功能：客户列表、成交状态筛选、新增回访记录、回访提醒（临近/逾期标红）。
 */
import { ref, reactive, computed } from 'vue'
import { customers as mockCustomers, deepClone } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import DataTable from '../components/DataTable.vue'
import FilterBar from '../components/FilterBar.vue'
import Modal from '../components/Modal.vue'
import Icon from '../components/Icon.vue'

const toast = useToast()
const customerList = ref(deepClone(mockCustomers))

// 当前日期（演示基准）
const TODAY = '2026-10-21'

const filters = reactive({ keyword: '', dealStatus: '' })
const filterFields = [
  { type: 'input', key: 'keyword', placeholder: '搜索客户/联系人' },
  { type: 'select', key: 'dealStatus', options: [
    { label: '全部状态', value: '' }, { label: '已成交', value: '已成交' }, { label: '跟进中', value: '跟进中' }, { label: '潜在', value: '潜在' }
  ] }
]

const columns = [
  { key: 'id', label: '编号', width: 80 },
  { key: 'name', label: '客户名称' },
  { key: 'contact', label: '联系人', width: 90 },
  { key: 'phone', label: '联系电话', width: 130 },
  { key: 'dealStatus', label: '成交状态', width: 90 },
  { key: 'nextVisit', label: '下次回访', width: 120 },
  { key: 'actions', label: '操作', width: 150 }
]

const filtered = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  return customerList.value.filter(c => {
    if (kw && !(c.name.toLowerCase().includes(kw) || c.contact.toLowerCase().includes(kw))) return false
    if (filters.dealStatus && c.dealStatus !== filters.dealStatus) return false
    return true
  })
})

// 回访是否紧急（今天及之前需回访）
function isUrgent(date) { return date <= TODAY }

// 新增回访记录弹窗
const followVisible = ref(false)
const activeCustomer = ref(null)
const followForm = reactive({ content: '', nextVisit: '' })
function openFollow(row) {
  activeCustomer.value = row
  followForm.content = ''
  followForm.nextVisit = row.nextVisit
  followVisible.value = true
}
function submitFollow() {
  if (!followForm.content.trim()) { toast.error('请输入回访内容'); return }
  const now = new Date()
  const time = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
  activeCustomer.value.followRecords.unshift({ time, content: followForm.content.trim() })
  if (followForm.nextVisit) activeCustomer.value.nextVisit = followForm.nextVisit
  followVisible.value = false
  toast.success('回访记录已添加')
}

// 查看跟进记录弹窗
const recordsVisible = ref(false)
const recordsCustomer = ref(null)
function openRecords(row) {
  recordsCustomer.value = row
  recordsVisible.value = true
}

function dealClass(s) {
  return { 已成交: 'wb-tag-success', 跟进中: 'wb-tag-warning', 潜在: 'wb-tag-default' }[s] || 'wb-tag-default'
}
</script>

<template>
  <div class="wb-page">
    <div class="wb-page-header">
      <div class="wb-page-title">客户管理</div>
    </div>

    <FilterBar :fields="filterFields" @change="Object.assign(filters, $event)" />

    <DataTable :columns="columns" :data="filtered">
      <template #dealStatus="{ value }"><span class="wb-tag" :class="dealClass(value)">{{ value }}</span></template>
      <template #nextVisit="{ row }">
        <span class="wb-tag" :class="isUrgent(row.nextVisit) ? 'wb-tag-danger' : 'wb-tag-default'">
          <Icon v-if="isUrgent(row.nextVisit)" name="warning" :size="12" style="margin-right:2px" />{{ row.nextVisit }}
        </span>
      </template>
      <template #actions="{ row }">
        <button class="wb-btn wb-btn-sm wb-btn-default" @click="openFollow(row)">回访</button>
        <button class="wb-btn wb-btn-sm wb-btn-default" @click="openRecords(row)">记录</button>
      </template>
    </DataTable>

    <!-- 新增回访记录 -->
    <Modal :visible="followVisible" title="新增回访记录" width="480" @close="followVisible = false">
      <div class="wb-form-item">
        <label class="wb-form-label">客户</label>
        <input class="wb-field" :value="activeCustomer?.name" disabled />
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">回访内容<span class="req">*</span></label>
        <textarea v-model="followForm.content" class="wb-field" placeholder="请输入本次回访内容"></textarea>
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">下次回访时间</label>
        <input v-model="followForm.nextVisit" type="date" class="wb-field" />
      </div>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="followVisible = false">取消</button>
        <button class="wb-btn wb-btn-primary" @click="submitFollow">保存</button>
      </template>
    </Modal>

    <!-- 跟进记录 -->
    <Modal :visible="recordsVisible" :title="'跟进记录 · ' + (recordsCustomer?.name || '')" width="520" @close="recordsVisible = false">
      <div v-if="recordsCustomer" class="wb-records">
        <div v-for="(r, i) in recordsCustomer.followRecords" :key="i" class="wb-record">
          <div class="wb-record-time">{{ r.time }}</div>
          <div class="wb-record-content">{{ r.content }}</div>
        </div>
        <div v-if="!recordsCustomer.followRecords.length" class="wb-empty">暂无跟进记录</div>
      </div>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="recordsVisible = false">关闭</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.wb-records { max-height: 360px; overflow-y: auto; }
.wb-record {
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;
}
.wb-record-time { font-size: 12px; color: #86909c; margin-bottom: 4px; }
.wb-record-content { font-size: 13px; color: #1d2129; line-height: 1.6; }
.wb-empty { text-align: center; color: #86909c; padding: 30px 0; }
</style>
