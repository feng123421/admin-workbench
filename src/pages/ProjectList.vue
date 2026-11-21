<script setup>
/**
 * ProjectList.vue —— 项目管理
 * 功能：项目列表、进度展示、风险预警（延期标红）、查看关联任务。
 */
import { ref, computed } from 'vue'
import { projects as mockProjects, tasks as mockTasks, deepClone } from '../mock.js'
import DataTable from '../components/DataTable.vue'
import Modal from '../components/Modal.vue'
import Icon from '../components/Icon.vue'

const projectList = ref(deepClone(mockProjects))

const columns = [
  { key: 'id', label: '编号', width: 80 },
  { key: 'name', label: '项目名称' },
  { key: 'period', label: '起止时间', width: 220 },
  { key: 'progress', label: '进度', width: 180 },
  { key: 'risk', label: '风险状态', width: 100 },
  { key: 'owner', label: '负责人', width: 90 },
  { key: 'actions', label: '操作', width: 120 }
]

// 查看关联任务
const relatedVisible = ref(false)
const relatedProject = ref(null)
const relatedTasks = computed(() => {
  if (!relatedProject.value) return []
  const ids = relatedProject.value.taskIds || []
  return mockTasks.filter(t => ids.includes(t.id))
})
function openRelated(row) {
  relatedProject.value = row
  relatedVisible.value = true
}

function riskClass(r) {
  return { 正常: 'wb-tag-success', 预警: 'wb-tag-warning', 延期: 'wb-tag-danger' }[r] || 'wb-tag-default'
}
</script>

<template>
  <div class="wb-page">
    <div class="wb-page-header">
      <div class="wb-page-title">项目管理</div>
    </div>

    <DataTable :columns="columns" :data="projectList">
      <template #period="{ row }">
        <span>{{ row.startDate }} ~ {{ row.endDate }}</span>
      </template>
      <template #progress="{ value }">
        <div class="wb-progress">
          <div class="wb-progress-bar" :class="{ danger: value < 50, warning: value >= 50 && value < 90 }" :style="{ width: value + '%' }"></div>
        </div>
        <span class="wb-progress-text">{{ value }}%</span>
      </template>
      <template #risk="{ value }">
        <span class="wb-tag" :class="riskClass(value)">
          <Icon v-if="value === '延期'" name="warning" :size="12" style="margin-right:2px" />{{ value }}
        </span>
      </template>
      <template #actions="{ row }">
        <button class="wb-btn wb-btn-sm wb-btn-default" @click="openRelated(row)">关联任务</button>
      </template>
    </DataTable>

    <!-- 关联任务弹窗 -->
    <Modal :visible="relatedVisible" :title="'关联任务 · ' + (relatedProject?.name || '')" width="640" @close="relatedVisible = false">
      <div v-if="relatedTasks.length">
        <DataTable
          :columns="[
            { key: 'id', label: '编号', width: 90 },
            { key: 'title', label: '标题' },
            { key: 'owner', label: '负责人', width: 90 },
            { key: 'status', label: '状态', width: 90 }
          ]"
          :data="relatedTasks"
        >
          <template #status="{ value }">
            <span class="wb-tag" :class="{ 待办: 'wb-tag-default', 进行中: 'wb-tag-primary', 已完成: 'wb-tag-success', 驳回: 'wb-tag-danger' }[value]">{{ value }}</span>
          </template>
        </DataTable>
      </div>
      <div v-else class="wb-empty">该项目暂无关联任务</div>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="relatedVisible = false">关闭</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.wb-progress-text { display: inline-block; margin-left: 8px; font-size: 12px; color: #4e5969; vertical-align: middle; }
.wb-empty { text-align: center; color: #86909c; padding: 30px 0; }
</style>
