<script setup>
/**
 * ResourceCenter.vue —— 资源中心
 * 功能：文档列表、分类筛选、模拟文件下载。
 */
import { ref, reactive, computed } from 'vue'
import { resources as mockResources, deepClone, today } from '../mock.js'
import { store } from '../store.js'
import { useToast } from '../composables/useToast.js'
import DataTable from '../components/DataTable.vue'
import FilterBar from '../components/FilterBar.vue'
import Modal from '../components/Modal.vue'
import Select from '../components/Select.vue'
import Icon from '../components/Icon.vue'

const toast = useToast()
const resourceList = ref(deepClone(mockResources))

// ============ 上传安全限制 ============
// 模拟上传：不读取、不上传文件内容，仅展示文件名与体积；仍做基础校验以防异常输入。
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'gif', 'zip']
const ACCEPT_ATTR = ALLOWED_EXT.map(e => '.' + e).join(',')

/** 文件名净化：移除路径分隔符与控制字符，限制长度，避免异常下载名 */
function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[\\/\r\n\t]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/^\.+/, '')
    .slice(0, 100)
    .trim() || '未命名文件'
}

// 分类选项（从数据中提取）
const categories = computed(() => {
  const set = new Set(mockResources.map(r => r.category))
  return [{ label: '全部分类', value: '' }, ...[...set].map(c => ({ label: c, value: c }))]
})

// 上传分类选项（用于上传弹窗，不含"全部分类"）
const uploadCategories = computed(() => {
  const set = new Set(mockResources.map(r => r.category))
  return [...set].map(c => ({ label: c, value: c }))
})

const filters = reactive({ keyword: '', category: '' })
const filterFields = [
  { type: 'input', key: 'keyword', placeholder: '搜索文档名称' },
  { type: 'select', key: 'category', options: categories.value }
]

const columns = [
  { key: 'id', label: '编号', width: 80 },
  { key: 'name', label: '文档名称' },
  { key: 'category', label: '分类', width: 110 },
  { key: 'size', label: '大小', width: 90 },
  { key: 'uploadTime', label: '上传时间', width: 120 },
  { key: 'owner', label: '上传人', width: 90 },
  { key: 'actions', label: '操作', width: 100 }
]

const filtered = computed(() => {
  const kw = filters.keyword.trim().toLowerCase()
  return resourceList.value.filter(r => {
    if (kw && !r.name.toLowerCase().includes(kw)) return false
    if (filters.category && r.category !== filters.category) return false
    return true
  })
})

// 模拟下载：生成占位内容并触发浏览器下载
function download(row) {
  const safeName = sanitizeFileName(row.name)
  const content = `这是「${safeName}」的模拟下载文件。\n分类：${row.category}\n上传人：${row.owner}\n上传时间：${row.uploadTime}\n`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName + '.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 延迟回收，避免部分浏览器下载尚未启动就释放 Blob URL
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast.success(`开始下载：${safeName}`)
}

function catClass(c) {
  return { 产品文档: 'wb-tag-primary', 技术规范: 'wb-tag-default', 管理制度: 'wb-tag-warning', 培训材料: 'wb-tag-success' }[c] || 'wb-tag-default'
}

// ============ 上传资料（模拟） ============
const uploadVisible = ref(false)
const uploadForm = reactive({ name: '', category: '产品文档', file: null, fileSize: '' })
const fileInput = ref(null)

function openUpload() {
  Object.assign(uploadForm, { name: '', category: '产品文档', file: null, fileSize: '' })
  uploadVisible.value = true
}
function pickFile() { fileInput.value && fileInput.value.click() }
function onFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  // 扩展名白名单 + 体积上限校验
  const ext = (f.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) {
    toast.error('仅支持常见文档、图片与压缩包格式')
    e.target.value = ''
    return
  }
  if (f.size > MAX_UPLOAD_SIZE) {
    toast.error('文件大小不能超过 20MB')
    e.target.value = ''
    return
  }
  uploadForm.file = f
  // 未手动改名时，默认用文件名（去扩展名）并做净化
  if (!uploadForm.name) uploadForm.name = sanitizeFileName(f.name.replace(/\.[^.]+$/, ''))
  // 体积格式化
  const b = f.size
  uploadForm.fileSize = b < 1024 * 1024
    ? (b / 1024).toFixed(1) + ' KB'
    : (b / 1024 / 1024).toFixed(1) + ' MB'
}
function confirmUpload() {
  if (!uploadForm.file) { toast.error('请先选择要上传的文件'); return }
  const maxId = Math.max(...resourceList.value.map(r => parseInt(r.id.replace('R-', '')) || 0))
  const size = uploadForm.fileSize || (uploadForm.file.size < 1024 * 1024
    ? (uploadForm.file.size / 1024).toFixed(1) + ' KB'
    : (uploadForm.file.size / 1024 / 1024).toFixed(1) + ' MB')
  resourceList.value.unshift({
    id: 'R-' + (maxId + 1),
    name: sanitizeFileName(uploadForm.name || uploadForm.file.name),
    category: uploadForm.category,
    size,
    uploadTime: today(),
    owner: store?.currentUser?.name || '我'
  })
  uploadVisible.value = false
  toast.success('资料已上传')
}
</script>

<template>
  <div class="wb-page">
    <div class="wb-page-header">
      <div class="wb-page-title">资源中心</div>
      <div class="wb-page-actions">
        <button class="wb-btn wb-btn-primary" @click="openUpload">
          <Icon name="upload" :size="14" /> 上传资料
        </button>
      </div>
    </div>

    <FilterBar :fields="filterFields" @change="Object.assign(filters, $event)" />

    <DataTable :columns="columns" :data="filtered">
      <template #category="{ value }"><span class="wb-tag" :class="catClass(value)">{{ value }}</span></template>
      <template #actions="{ row }">
        <button class="wb-btn wb-btn-sm wb-btn-primary" @click="download(row)">
          <Icon name="download" :size="13" /> 下载
        </button>
      </template>
    </DataTable>

    <!-- 上传资料弹窗（模拟） -->
    <Modal :visible="uploadVisible" title="上传资料" width="520" @close="uploadVisible = false">
      <div class="wb-form-item">
        <label class="wb-form-label">选择文件<span class="req">*</span></label>
        <input ref="fileInput" type="file" :accept="ACCEPT_ATTR" style="display:none" @change="onFileChange" />
        <div class="rc-upload" @click="pickFile">
          <Icon name="upload" :size="18" />
          <span v-if="uploadForm.file">{{ uploadForm.file.name }}（{{ uploadForm.fileSize }}）</span>
          <span v-else class="rc-upload-tip">点击选择要上传的文件</span>
        </div>
        <div class="rc-upload-hint">支持 PDF / Office / 图片 / ZIP 等常见格式，单个文件不超过 20MB</div>
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">文档名称</label>
        <input v-model="uploadForm.name" class="wb-field" placeholder="留空则使用文件名" />
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">分类</label>
        <Select v-model="uploadForm.category" :options="uploadCategories" />
      </div>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="uploadVisible = false">取消</button>
        <button class="wb-btn wb-btn-primary" @click="confirmUpload">确认上传</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
/* 上传选择区：虚线框，点击触发隐藏 file input */
.rc-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px dashed #c9cdd4;
  border-radius: 6px;
  background: #fafbfc;
  color: #86909c;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.rc-upload:hover { border-color: #165dff; color: #165dff; }
.rc-upload-tip { color: #86909c; }
.rc-upload-hint { margin-top: 6px; font-size: 12px; color: #86909c; line-height: 1.5; }
.rc-upload span:not(.rc-upload-tip) { color: #1d2129; }
</style>
