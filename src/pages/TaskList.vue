<script setup>
/**
 * TaskList.vue —— 任务与待办管理
 * 功能：新增、编辑、查看详情、删除（二次确认）、批量修改状态、筛选、排序、分页。
 */
import { ref, reactive, computed } from 'vue'
import { tasks as mockTasks, deepClone } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import { openConfirm } from '../store.js'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import FilterBar from '../components/FilterBar.vue'
import Modal from '../components/Modal.vue'
import Select from '../components/Select.vue'
import Icon from '../components/Icon.vue'

const toast = useToast()

// 本地任务数据（深拷贝，避免污染 mock）
const taskList = ref(deepClone(mockTasks))

// 筛选条件
const filters = reactive({ keyword: '', type: '', status: '', priority: '' })
const filterFields = [
  { type: 'input', key: 'keyword', placeholder: '搜索标题/负责人' },
  { type: 'select', key: 'type', options: [
    { label: '全部类型', value: '' }, { label: '需求', value: '需求' }, { label: '缺陷', value: '缺陷' }, { label: '迭代', value: '迭代' }, { label: '其他', value: '其他' }
  ] },
  { type: 'select', key: 'status', options: [
    { label: '全部状态', value: '' }, { label: '待办', value: '待办' }, { label: '进行中', value: '进行中' }, { label: '已完成', value: '已完成' }, { label: '驳回', value: '驳回' }
  ] },
  { type: 'select', key: 'priority', options: [
    { label: '全部优先级', value: '' }, { label: '高', value: '高' }, { label: '中', value: '中' }, { label: '低', value: '低' }
  ] }
]

// 排序
const sortKey = ref('')
const sortOrder = ref('')
const priorityWeight = { 高: 3, 中: 2, 低: 1 }

// 分页
const pageSize = 8
const currentPage = ref(1)

// 选中项（批量操作）
const selectedIds = ref([])

// 弹窗状态
const formVisible = ref(false)
const detailVisible = ref(false)
const batchVisible = ref(false)
const editingId = ref(null)
const detailRow = ref(null)
const batchStatus = ref('')
// 任务内容：每满 100 个字符插入一个换行，实现「满 100 字符换行」
const detailContent = computed(() => {
  const c = detailRow.value?.content
  if (!c) return ''
  return c.replace(/(.{100})/g, '$1\n')
})

// 表单
const form = reactive({ title: '', content: '', type: '需求', owner: '', due: '', priority: '中', status: '待办' })
const typeOptions = ['需求', '缺陷', '迭代', '其他']
const statusOptions = ['待办', '进行中', '已完成', '驳回']
const priorityOptions = ['高', '中', '低']

const columns = [
  { key: 'sel', label: '', width: 44 },
  { key: 'id', label: '编号', width: 90 },
  { key: 'title', label: '标题' },
  { key: 'type', label: '类型', width: 80 },
  { key: 'owner', label: '负责人', width: 90 },
  { key: 'due', label: '截止时间', width: 120, sortable: true },
  { key: 'priority', label: '优先级', width: 80, sortable: true },
  { key: 'status', label: '状态', width: 90 },
  { key: 'actions', label: '操作', width: 170 }
]

// 过滤 + 排序
const filtered = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  let list = taskList.value.filter(t => {
    if (kw && !(t.title.toLowerCase().includes(kw) || t.owner.toLowerCase().includes(kw))) return false
    if (filters.type && t.type !== filters.type) return false
    if (filters.status && t.status !== filters.status) return false
    if (filters.priority && t.priority !== filters.priority) return false
    return true
  })
  if (sortKey.value && sortOrder.value) {
    list = [...list].sort((a, b) => {
      let av = a[sortKey.value], bv = b[sortKey.value]
      if (sortKey.value === 'priority') { av = priorityWeight[av]; bv = priorityWeight[bv] }
      if (av < bv) return sortOrder.value === 'asc' ? -1 : 1
      if (av > bv) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }
  return list
})

// 分页数据
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
const total = computed(() => filtered.value.length)

// 翻页时清空选择
function onPageChange(p) {
  currentPage.value = p
  selectedIds.value = []
}

function onSortChange({ key, order }) {
  sortKey.value = key
  sortOrder.value = order
  currentPage.value = 1
}

// 选择逻辑
function isSelected(id) { return selectedIds.value.includes(id) }
function toggleSelect(id) {
  const i = selectedIds.value.indexOf(id)
  if (i > -1) selectedIds.value.splice(i, 1)
  else selectedIds.value.push(id)
}
function pageAllSelected() {
  return paged.value.length > 0 && paged.value.every(r => isSelected(r.id))
}
function togglePageAll() {
  if (pageAllSelected()) {
    paged.value.forEach(r => {
      const i = selectedIds.value.indexOf(r.id)
      if (i > -1) selectedIds.value.splice(i, 1)
    })
  } else {
    paged.value.forEach(r => { if (!isSelected(r.id)) selectedIds.value.push(r.id) })
  }
}

// 新增 / 编辑
function openCreate() {
  editingId.value = null
  Object.assign(form, { title: '', content: '', type: '需求', owner: '', due: '', priority: '中', status: '待办' })
  formVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, deepClone(row))
  formVisible.value = true
}
function openDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}
function submitForm() {
  if (!form.title.trim()) { toast.error('请输入任务标题'); return }
  if (!form.owner.trim()) { toast.error('请输入负责人'); return }
  if (editingId.value) {
    const idx = taskList.value.findIndex(t => t.id === editingId.value)
    if (idx > -1) taskList.value[idx] = { ...deepClone(form), id: editingId.value }
    toast.success('任务已更新')
  } else {
    const maxId = Math.max(...taskList.value.map(t => parseInt(t.id.replace('T-', '')) || 0))
    const newId = 'T-' + (maxId + 1)
    taskList.value.unshift({ ...deepClone(form), id: newId, createTime: '2026-10-21' })
    toast.success('任务已创建')
  }
  formVisible.value = false
}

// 删除（二次确认）
async function removeTask(row) {
  const ok = await openConfirm({ title: '删除任务', message: `确定删除「${row.title}」吗？此操作不可恢复。`, confirmText: '删除' })
  if (!ok) return
  taskList.value = taskList.value.filter(t => t.id !== row.id)
  // 删除后若当前页已无数据（如处于最后一页），回退到第一页，避免表格空白
  if (currentPage.value > Math.ceil(total.value / pageSize)) currentPage.value = 1
  toast.success('已删除')
}

// 批量修改状态
function openBatch() {
  if (!selectedIds.value.length) { toast.error('请先勾选任务'); return }
  batchStatus.value = '进行中'
  batchVisible.value = true
}
function applyBatch() {
  const count = selectedIds.value.length
  taskList.value = taskList.value.map(t =>
    selectedIds.value.includes(t.id) ? { ...t, status: batchStatus.value } : t
  )
  batchVisible.value = false
  selectedIds.value = []
  toast.success(`已更新 ${count} 个任务状态`)
}

// 标签样式
function statusClass(s) {
  return { 待办: 'wb-tag-default', 进行中: 'wb-tag-primary', 已完成: 'wb-tag-success', 驳回: 'wb-tag-danger' }[s] || 'wb-tag-default'
}
function priorityClass(p) {
  return { 高: 'wb-tag-danger', 中: 'wb-tag-warning', 低: 'wb-tag-default' }[p] || 'wb-tag-default'
}
</script>

<template>
  <div class="wb-page">
    <div class="wb-page-header">
      <div class="wb-page-title">任务与待办</div>
      <div class="wb-page-actions">
        <button class="wb-btn wb-btn-default" @click="openBatch">批量改状态</button>
        <button class="wb-btn wb-btn-primary" @click="openCreate">
          <Icon name="plus" :size="14" /> 新建任务
        </button>
      </div>
    </div>

    <FilterBar :fields="filterFields" @change="Object.assign(filters, $event); currentPage = 1" />

    <DataTable
      :columns="columns"
      :data="paged"
      :sort-key="sortKey"
      :sort-order="sortOrder"
      @sort-change="onSortChange"
    >
      <!-- 选择列 -->
      <template #sel="{ row }">
        <input type="checkbox" :checked="isSelected(row.id)" @change="toggleSelect(row.id)" />
      </template>
      <template #sel-header>
        <input type="checkbox" :checked="pageAllSelected()" @change="togglePageAll" />
      </template>
      <!-- 优先级 -->
      <template #priority="{ value }"><span class="wb-tag" :class="priorityClass(value)">{{ value }}</span></template>
      <!-- 状态 -->
      <template #status="{ value }"><span class="wb-tag" :class="statusClass(value)">{{ value }}</span></template>
      <!-- 操作 -->
      <template #actions="{ row }">
        <button class="wb-btn wb-btn-sm wb-btn-default" @click="openDetail(row)">详情</button>
        <button class="wb-btn wb-btn-sm wb-btn-default" @click="openEdit(row)">编辑</button>
        <button class="wb-btn wb-btn-sm wb-btn-danger" @click="removeTask(row)">删除</button>
      </template>
    </DataTable>

    <Pagination :total="total" :page-size="pageSize" :current="currentPage" @change="onPageChange" />

    <!-- 新增/编辑弹窗 -->
    <Modal :visible="formVisible" :title="editingId ? '编辑任务' : '新建任务'" width="520" @close="formVisible = false">
      <div class="wb-form-item">
        <label class="wb-form-label">标题<span class="req">*</span></label>
        <input v-model="form.title" class="wb-field" placeholder="请输入任务标题" />
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">任务内容</label>
        <textarea v-model="form.content" class="wb-field" rows="4" placeholder="请输入任务内容、要求或备注信息" />
      </div>
      <div class="wb-form-row">
        <div class="wb-form-item">
          <label class="wb-form-label">类型</label>
          <Select v-model="form.type" :options="typeOptions" />
        </div>
        <div class="wb-form-item">
          <label class="wb-form-label">负责人<span class="req">*</span></label>
          <input v-model="form.owner" class="wb-field" placeholder="请输入负责人" />
        </div>
      </div>
      <div class="wb-form-row">
        <div class="wb-form-item">
          <label class="wb-form-label">截止时间</label>
          <input v-model="form.due" type="date" class="wb-field" />
        </div>
        <div class="wb-form-item">
          <label class="wb-form-label">优先级</label>
          <Select v-model="form.priority" :options="priorityOptions" />
        </div>
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">状态</label>
        <Select v-model="form.status" :options="statusOptions" />
      </div>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="formVisible = false">取消</button>
        <button class="wb-btn wb-btn-primary" @click="submitForm">保存</button>
      </template>
    </Modal>

    <!-- 详情弹窗 -->
    <Modal :visible="detailVisible" title="任务详情" width="640" @close="detailVisible = false">
      <div v-if="detailRow" class="wb-detail">
        <div class="wb-detail-row"><span>编号</span><b>{{ detailRow.id }}</b></div>
        <div class="wb-detail-row"><span>标题</span><b>{{ detailRow.title }}</b></div>
        <div class="wb-detail-row wb-detail-block">
          <span>任务内容</span>
          <b class="wb-detail-content">{{ detailContent || '—' }}</b>
        </div>
        <div class="wb-detail-row"><span>类型</span><b>{{ detailRow.type }}</b></div>
        <div class="wb-detail-row"><span>负责人</span><b>{{ detailRow.owner }}</b></div>
        <div class="wb-detail-row"><span>截止时间</span><b>{{ detailRow.due }}</b></div>
        <div class="wb-detail-row"><span>优先级</span><b><span class="wb-tag" :class="priorityClass(detailRow.priority)">{{ detailRow.priority }}</span></b></div>
        <div class="wb-detail-row"><span>状态</span><b><span class="wb-tag" :class="statusClass(detailRow.status)">{{ detailRow.status }}</span></b></div>
        <div class="wb-detail-row"><span>创建时间</span><b>{{ detailRow.createTime }}</b></div>
      </div>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="detailVisible = false">关闭</button>
      </template>
    </Modal>

    <!-- 批量改状态弹窗 -->
    <Modal :visible="batchVisible" title="批量修改状态" width="420" @close="batchVisible = false">
      <div class="wb-form-item">
        <label class="wb-form-label">将选中 {{ selectedIds.length }} 个任务修改为</label>
        <Select v-model="batchStatus" :options="statusOptions" />
      </div>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="batchVisible = false">取消</button>
        <button class="wb-btn wb-btn-primary" @click="applyBatch">确认修改</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
/* 详情行：标签固定宽度左对齐，值占满剩余空间，行距舒展、阅读省力 */
.wb-detail-row {
  display: flex;
  align-items: flex-start;
  padding: 13px 0;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
  line-height: 1.6;
}
.wb-detail-row:last-child { border-bottom: none; }
.wb-detail-row span { color: #86909c; width: 96px; flex-shrink: 0; }
.wb-detail-row b { color: #1d2129; font-weight: 500; flex: 1; word-break: break-word; }
/* 任务内容块：纵向展示，严格按每 100 字符换行（由 detailContent 计算插入 \n） */
.wb-detail-block { flex-direction: column; gap: 6px; }
.wb-detail-block > span { width: auto; }
.wb-detail-content { line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
</style>
