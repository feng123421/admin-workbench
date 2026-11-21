<script setup>
/**
 * Dashboard.vue —— 首页数据概览看板
 * - 顶部指标卡片（按角色差异化）
 * - ECharts：营收趋势折线图、项目工作量柱状图、订单状态饼图
 * - 快捷操作入口、最近动态列表
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { store, navigate } from '../store.js'
import { metricsByRole, projects, orders, recentActivities, roleLabelMap } from '../mock.js'

// 当前角色的指标卡片
const metrics = computed(() => metricsByRole[store.currentUser?.role] || [])

// 营收趋势（近 12 个月，演示数据）
const revenueData = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  values: [68, 72, 85, 79, 92, 105, 98, 120, 115, 128, 119, 142]
}

// 项目工作量（各项目任务数）
const workload = computed(() =>
  projects.map(p => ({ name: p.name, count: p.taskIds.length }))
)

// 订单状态分布
const orderStatus = computed(() => {
  const map = {}
  orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1 })
  return Object.keys(map).map(k => ({ name: k, value: map[k] }))
})

const lineRef = ref(null)
const barRef = ref(null)
const pieRef = ref(null)
let charts = []

function renderCharts() {
  // 折线图：营收趋势
  const line = echarts.init(lineRef.value)
  line.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: revenueData.months, boundaryGap: false, axisLine: { lineStyle: { color: '#e5e6eb' } }, axisLabel: { color: '#86909c' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5' } }, axisLabel: { color: '#86909c' } },
    series: [{
      name: '营收(万)', type: 'line', smooth: true, data: revenueData.values,
      lineStyle: { color: '#165dff', width: 3 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(22,93,255,0.25)' }, { offset: 1, color: 'rgba(22,93,255,0.02)' }]) },
      itemStyle: { color: '#165dff' }, symbolSize: 6
    }]
  })
  charts.push(line)

  // 柱状图：项目工作量
  const bar = echarts.init(barRef.value)
  bar.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: workload.value.map(w => w.name), axisLine: { lineStyle: { color: '#e5e6eb' } }, axisLabel: { color: '#86909c', interval: 0, rotate: 30 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5' } }, axisLabel: { color: '#86909c' } },
    series: [{
      name: '任务数', type: 'bar', data: workload.value.map(w => w.count),
      itemStyle: { color: '#165dff', borderRadius: [4, 4, 0, 0] }, barWidth: '46%'
    }]
  })
  charts.push(bar)

  // 饼图：订单状态分布
  const pie = echarts.init(pieRef.value)
  pie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#86909c' } },
    color: ['#165dff', '#00b42a', '#ff7d00', '#f53f3f', '#86909c'],
    series: [{
      name: '订单状态', type: 'pie', radius: ['42%', '66%'], center: ['50%', '44%'],
      avoidLabelOverlap: true,
      label: { show: false }, data: orderStatus.value
    }]
  })
  charts.push(pie)
}

function onResize() { charts.forEach(c => c.resize()) }

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach(c => c.dispose())
  charts = []
})

// 快捷操作
const quickActions = [
  { label: '新建任务', icon: 'task', page: 'task' },
  { label: '查看订单', icon: 'order', page: 'order' },
  { label: '客户跟进', icon: 'customer', page: 'customer' },
  { label: '项目看板', icon: 'project', page: 'project' }
]
</script>

<template>
  <div class="wb-page">
    <!-- 欢迎语 -->
    <div class="wb-dash-welcome">
      <span>你好，{{ store.currentUser?.name }}（{{ roleLabelMap[store.currentUser?.role] }}）</span>
      <span class="wb-dash-date">数据更新于 2026-10-21</span>
    </div>

    <!-- 指标卡片 -->
    <div class="wb-metric-grid">
      <div v-for="m in metrics" :key="m.key" class="wb-card wb-metric">
        <div class="wb-metric-label">{{ m.label }}</div>
        <div class="wb-metric-value">{{ m.value }}</div>
        <div class="wb-metric-trend" :class="m.up ? 'up' : 'down'">
          {{ m.trend }} 较上月
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="wb-chart-grid">
      <div class="wb-card wb-chart-card">
        <div class="wb-card-title">营收趋势（万元）</div>
        <div ref="lineRef" class="wb-chart"></div>
      </div>
      <div class="wb-card wb-chart-card">
        <div class="wb-card-title">项目工作量（任务数）</div>
        <div ref="barRef" class="wb-chart"></div>
      </div>
      <div class="wb-card wb-chart-card">
        <div class="wb-card-title">订单状态分布</div>
        <div ref="pieRef" class="wb-chart"></div>
      </div>
    </div>

    <!-- 快捷操作 + 最近动态 -->
    <div class="wb-bottom-grid">
      <div class="wb-card">
        <div class="wb-card-title">快捷操作</div>
        <div class="wb-quick-grid">
          <div
            v-for="q in quickActions"
            :key="q.page"
            class="wb-quick-item"
            @click="navigate(q.page)"
          >
            <Icon :name="q.icon" :size="20" />
            <span>{{ q.label }}</span>
          </div>
        </div>
      </div>
      <div class="wb-card">
        <div class="wb-card-title">最近动态</div>
        <ul class="wb-activity">
          <li v-for="a in recentActivities" :key="a.id">
            <span class="wb-tag" :class="'wb-tag-' + (a.type === '系统' ? 'primary' : a.type === '订单' ? 'success' : a.type === '项目' ? 'warning' : 'default')">{{ a.type }}</span>
            <div class="wb-activity-main">
              <div class="wb-activity-text">{{ a.text }}</div>
              <div class="wb-activity-time">{{ a.time }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wb-dash-welcome {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #1d2129;
}
.wb-dash-date { font-size: 12px; color: #86909c; }

.wb-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.wb-metric { padding: 18px 20px; }
.wb-metric-label { font-size: 13px; color: #86909c; }
.wb-metric-value { font-size: 26px; font-weight: 700; color: #1d2129; margin: 8px 0 6px; }
.wb-metric-trend { font-size: 12px; }
.wb-metric-trend.up { color: #00b42a; }
.wb-metric-trend.down { color: #f53f3f; }

.wb-chart-grid {
  display: grid;
  grid-template-columns: 1.4fr 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.wb-chart { width: 100%; height: 280px; }

.wb-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.wb-quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.wb-quick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  cursor: pointer;
  color: #4e5969;
  font-size: 14px;
}
.wb-quick-item:hover { border-color: #165dff; color: #165dff; background: #f7faff; }
.wb-quick-item :deep(.wb-icon) { color: #165dff; }

.wb-activity { list-style: none; margin: 0; padding: 0; }
.wb-activity li {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f3f5;
}
.wb-activity li:last-child { border-bottom: none; }
.wb-activity-main { flex: 1; }
.wb-activity-text { font-size: 13px; color: #1d2129; }
.wb-activity-time { font-size: 12px; color: #c9cdd4; margin-top: 2px; }

/* 适配 narrower 的 PC 分辨率 */
@media (max-width: 1440px) {
  .wb-chart-grid { grid-template-columns: 1fr 1fr; }
  .wb-chart-grid .wb-chart-card:last-child { grid-column: span 2; }
}
@media (max-width: 1100px) {
  .wb-metric-grid { grid-template-columns: repeat(2, 1fr); }
  .wb-chart-grid { grid-template-columns: 1fr; }
  .wb-chart-grid .wb-chart-card:last-child { grid-column: auto; }
  .wb-bottom-grid { grid-template-columns: 1fr; }
}
</style>
