/**
 * mock.js —— 全量本地模拟数据
 * ------------------------------------------------------------------
 * 所有页面数据均来自本文件，不依赖任何真实后端。
 * 如需对接真实接口，只需把各模块的数据获取替换为 API 调用即可。
 *
 * 数据模块：
 *   accounts            登录账号（区分角色）
 *   roles              角色定义 + 各角色可访问的菜单模块
 *   modules            系统全部功能模块（菜单 + 权限配置共用）
 *   metricsByRole      首页指标卡片（按角色差异化展示）
 *   tasks              任务与待办
 *   orders             订单
 *   projects           项目（含关联任务）
 *   customers          客户（含跟进记录）
 *   notifications      通知消息
 *   resources          资源中心文档
 *   recentActivities   首页最近动态
 */

// ========================= 0. 演示日期工具 =========================
/**
 * 演示数据不再写死具体日期：全部以「运行当天」为基准，按天偏移生成。
 * 无论哪天打开，任务截止、订单、通知、回访提醒的先后关系（逾期/临近/未来）
 * 都保持一致，也不会出现「上个月的数据」。统一使用本地时间，
 * 避免 toISOString() 在东八区造成日期差一天。
 */
function formatLocalDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
/** 今天 ± offset 天，返回 yyyy-MM-dd */
export function today(offset = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return formatLocalDate(d)
}
/** 今天 ± offset 天的 yyyy-MM-dd HH:mm */
export function dayTime(offset = 0, hhmm = '09:00') {
  return today(offset) + ' ' + hhmm
}
/** 当前本地时间 yyyy-MM-dd HH:mm（新增回访记录等运行时场景） */
export function nowTime() {
  const d = new Date()
  return formatLocalDate(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}
/** 订单号：按订单日期月份生成前缀 + 两位序号 */
export function orderNo(offset = 0, seq = 1) {
  return 'SO-' + today(offset).replace(/-/g, '').slice(0, 6) + String(seq).padStart(2, '0')
}

// ========================= 1. 登录账号 =========================
/**
 * 演示用同步摘要函数：避免前端「明文存储 + 明文比较」密码。
 * 安全说明：这不是密码学安全的哈希（无盐、非 bcrypt/Argon2），仅用于演示。
 * 纯前端无法真正保护凭据，生产环境必须由服务端完成密码哈希与校验。
 */
export function hashPassword(pwd) {
  let h1 = 0x811c9dc5
  let h2 = 0x9e3779b9
  const s = String(pwd)
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ (c + i + 1), 0x85ebca6b) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

// 初始演示密码的摘要值（对应 123456）。账号表不再保存明文密码。
export const DEFAULT_PASSWORD_HASH = '9995b6aad9a08fff'

// 初始演示密码（常量，仅用于界面提示）。各账号当前密码由 demoPasswords 单独维护，
// 任一角色改密只更新自己的条目，不再全局覆盖。
// 注意：这是演示项目的公开演示凭据，生产环境必须整体移除演示账号入口。
export const demoCredential = { password: '123456' }

export const accounts = [
  { username: 'superadmin', passwordHash: DEFAULT_PASSWORD_HASH, name: '张总', role: 'superadmin' },
  { username: 'pm', passwordHash: DEFAULT_PASSWORD_HASH, name: '李经理', role: 'pm' },
  { username: 'sales', passwordHash: DEFAULT_PASSWORD_HASH, name: '王销售', role: 'sales' },
  { username: 'finance', passwordHash: DEFAULT_PASSWORD_HASH, name: '赵财务', role: 'finance' },
  { username: 'employee', passwordHash: DEFAULT_PASSWORD_HASH, name: '陈员工', role: 'employee' }
]

/**
 * 登录页「一键填充」按账号分别取当前演示密码。
 * 每个账号独立维护：任一角色修改密码只更新自己的条目，不影响其他角色。
 * demoCredential.password 保留为「初始密码」常量，仅供界面提示展示。
 */
export const demoPasswords = Object.fromEntries(
  accounts.map(a => [a.username, demoCredential.password])
)

// ========================= 2. 系统功能模块 =========================
// key 同时用于「菜单跳转」与「权限配置」
export const modules = [
  { key: 'dashboard', label: '首页概览', icon: 'dashboard' },
  { key: 'task', label: '任务与待办', icon: 'task' },
  { key: 'order', label: '订单管理', icon: 'order' },
  { key: 'project', label: '项目管理', icon: 'project' },
  { key: 'customer', label: '客户管理', icon: 'customer' },
  { key: 'notification', label: '通知中心', icon: 'notification' },
  { key: 'resource', label: '资源中心', icon: 'resource' },
  { key: 'permission', label: '系统权限管理', icon: 'permission' },
  { key: 'settings', label: '个人设置', icon: 'settings' }
]

// ========================= 3. 角色与权限 =========================
export const roles = [
  {
    id: 'superadmin',
    name: '超级管理员',
    desc: '拥有系统全部权限，可配置角色菜单权限',
    // 可访问模块（permission 仅管理员可见）
    modules: ['dashboard', 'task', 'order', 'project', 'customer', 'notification', 'resource', 'permission', 'settings']
  },
  {
    id: 'pm',
    name: '项目经理',
    desc: '负责项目与团队任务推进',
    modules: ['dashboard', 'task', 'order', 'project', 'customer', 'notification', 'resource', 'settings']
  },
  {
    id: 'sales',
    name: '销售',
    desc: '负责客户跟进与订单转化',
    modules: ['dashboard', 'task', 'order', 'customer', 'notification', 'resource', 'settings']
  },
  {
    id: 'finance',
    name: '财务',
    desc: '负责订单收款与财务对账',
    modules: ['dashboard', 'order', 'notification', 'resource', 'settings']
  },
  {
    id: 'employee',
    name: '普通员工',
    desc: '处理分配的任务，查看通知与资源',
    modules: ['dashboard', 'task', 'notification', 'resource', 'settings']
  }
]

// 角色 id -> 中文名 的映射，便于页面展示
export const roleLabelMap = roles.reduce((acc, r) => {
  acc[r.id] = r.name
  return acc
}, {})

// ========================= 4. 首页指标卡片（按角色） =========================
export const metricsByRole = {
  superadmin: [
    { key: 'revenue', label: '本月营收', value: '¥1,286,400', trend: '+12.5%', up: true },
    { key: 'orders', label: '订单总数', value: '1,024', trend: '+8.2%', up: true },
    { key: 'projects', label: '进行中项目', value: '18', trend: '+3', up: true },
    { key: 'members', label: '团队人数', value: '56', trend: '+5', up: true }
  ],
  pm: [
    { key: 'myProjects', label: '我的项目', value: '8', trend: '+1', up: true },
    { key: 'myTasks', label: '负责任务', value: '34', trend: '+6', up: true },
    { key: 'done', label: '已完成任务', value: '21', trend: '+4', up: true },
    { key: 'overdue', label: '逾期任务', value: '3', trend: '-1', up: false }
  ],
  sales: [
    { key: 'myCustomers', label: '我的客户', value: '42', trend: '+5', up: true },
    { key: 'myOrders', label: '本月订单', value: '63', trend: '+11%', up: true },
    { key: 'pending', label: '待跟进订单', value: '9', trend: '-2', up: false },
    { key: 'deal', label: '成交金额', value: '¥486,200', trend: '+9.4%', up: true }
  ],
  finance: [
    { key: 'totalRevenue', label: '累计营收', value: '¥9,842,000', trend: '+15.1%', up: true },
    { key: 'pendingPay', label: '待收款', value: '¥312,800', trend: '-6%', up: false },
    { key: 'paid', label: '已收款订单', value: '912', trend: '+7%', up: true },
    { key: 'invoice', label: '待开票', value: '24', trend: '+3', up: true }
  ],
  employee: [
    { key: 'todo', label: '我的待办', value: '12', trend: '+2', up: true },
    { key: 'doing', label: '进行中', value: '5', trend: '+1', up: true },
    { key: 'done', label: '已完成', value: '38', trend: '+6', up: true },
    { key: 'notice', label: '未读通知', value: '4', trend: '-1', up: false }
  ]
}

// ========================= 5. 任务与待办 =========================
export const tasks = [
  { id: 'T-1001', title: '工作台首页改版设计', type: '需求', owner: '陈员工', due: today(4), priority: '高', status: '进行中', content: '梳理首页信息架构，重做指标卡与图表布局，统一主色与卡片间距，输出高保真设计稿。', createTime: today(-9) },
  { id: 'T-1002', title: '订单导出功能开发', type: '需求', owner: '陈员工', due: today(1), priority: '中', status: '待办', content: '支持按筛选条件导出 CSV，含订单编号、客户、金额、状态等字段，中文 BOM 防乱码。', createTime: today(-8) },
  { id: 'T-1003', title: '客户回访提醒逻辑修复', type: '缺陷', owner: '王销售', due: today(-1), priority: '高', status: '进行中', content: '修复临近/逾期回访未正确标红的问题，复查提醒时间计算逻辑。', createTime: today(-7) },
  { id: 'T-1004', title: '财务报表字段对齐', type: '需求', owner: '赵财务', due: today(-3), priority: '中', status: '已完成', content: '对齐财务报表与订单系统的金额、币种字段，统一精度与展示格式。', createTime: today(-11) },
  { id: 'T-1005', title: '登录页验证码性能优化', type: '缺陷', owner: '陈员工', due: today(-6), priority: '低', status: '驳回', content: '验证码生成耗时过高，需优化算法；当前方案被驳回，等待重新评估。', createTime: today(-12) },
  { id: 'T-1006', title: '项目风险预警规则梳理', type: '迭代', owner: '李经理', due: today(7), priority: '高', status: '待办', content: '整理延期、预警判定规则，明确责任人与升级路径，沉淀为配置项。', createTime: today(-6) },
  { id: 'T-1007', title: '资源中心分类重构', type: '需求', owner: '陈员工', due: today(9), priority: '中', status: '进行中', content: '将文档按产品、技术、管理重新分类，补充检索与下载统计。', createTime: today(-5) },
  { id: 'T-1008', title: '权限管理角色配置', type: '需求', owner: '张总', due: today(5), priority: '高', status: '进行中', content: '为各角色配置可访问模块，支持一键保存与实时生效。', createTime: today(-6) },
  { id: 'T-1009', title: '客户跟进记录导出', type: '需求', owner: '王销售', due: today(0), priority: '中', status: '待办', content: '支持按客户导出跟进记录，便于销售复盘与交接。', createTime: today(-4) },
  { id: 'T-1010', title: '订单状态机校验', type: '缺陷', owner: '赵财务', due: today(-2), priority: '高', status: '已完成', content: '校验订单状态流转合法性，防止非法状态跳变。', createTime: today(-10) },
  { id: 'T-1011', title: '首页图表加载性能', type: '缺陷', owner: '陈员工', due: today(2), priority: '中', status: '进行中', content: '优化 ECharts 初始化与数据更新，减少首屏渲染时间。', createTime: today(-3) },
  { id: 'T-1012', title: '项目甘特图原型', type: '迭代', owner: '李经理', due: today(12), priority: '低', status: '待办', content: '输出项目甘特图交互原型，验证进度与依赖关系展示。', createTime: today(-3) },
  { id: 'T-1013', title: '通知中心已读逻辑', type: '缺陷', owner: '陈员工', due: today(-4), priority: '中', status: '已完成', content: '修复批量已读后角标未刷新的问题。', createTime: today(-9) },
  { id: 'T-1014', title: '销售数据看板搭建', type: '需求', owner: '王销售', due: today(10), priority: '高', status: '待办', content: '搭建销售维度营收、成交、回款看板，支持下钻到客户。', createTime: today(-2) },
  { id: 'T-1015', title: '财务对账自动化', type: '迭代', owner: '赵财务', due: today(15), priority: '中', status: '进行中', content: '将线下对账流程自动化，定时比对订单与回款差异并预警。', createTime: today(-2) },
  { id: 'T-1016', title: '员工工作台个性化', type: '需求', owner: '陈员工', due: today(6), priority: '低', status: '待办', content: '支持默认着陆页、界面密度与欢迎语等个性化配置。', createTime: today(-1) }
]

// ========================= 6. 订单 =========================
export const orders = [
  { id: orderNo(-20, 1), customer: '北京云图科技', amount: 86000, createTime: dayTime(-20, '09:12'), status: '已完成', owner: '王销售' },
  { id: orderNo(-19, 2), customer: '上海远景信息', amount: 124000, createTime: dayTime(-19, '14:30'), status: '已付款', owner: '王销售' },
  { id: orderNo(-18, 3), customer: '广州海联实业', amount: 45000, createTime: dayTime(-18, '10:05'), status: '待付款', owner: '王销售' },
  { id: orderNo(-16, 4), customer: '深圳锐诚网络', amount: 230000, createTime: dayTime(-16, '16:48'), status: '已发货', owner: '王销售' },
  { id: orderNo(-15, 5), customer: '杭州智联软件', amount: 67000, createTime: dayTime(-15, '11:20'), status: '已完成', owner: '王销售' },
  { id: orderNo(-13, 6), customer: '成都天宇通信', amount: 98000, createTime: dayTime(-13, '09:40'), status: '已付款', owner: '王销售' },
  { id: orderNo(-12, 7), customer: '武汉星河数据', amount: 156000, createTime: dayTime(-12, '13:15'), status: '待付款', owner: '王销售' },
  { id: orderNo(-11, 8), customer: '南京博远电子', amount: 34000, createTime: dayTime(-11, '15:55'), status: '已取消', owner: '王销售' },
  { id: orderNo(-10, 9), customer: '西安宏图医疗', amount: 188000, createTime: dayTime(-10, '10:30'), status: '已发货', owner: '王销售' },
  { id: orderNo(-9, 10), customer: '苏州精工制造', amount: 72000, createTime: dayTime(-9, '14:10'), status: '已完成', owner: '王销售' },
  { id: orderNo(-8, 11), customer: '重庆联立科技', amount: 54000, createTime: dayTime(-8, '09:25'), status: '已付款', owner: '王销售' },
  { id: orderNo(-7, 12), customer: '天津华信集团', amount: 210000, createTime: dayTime(-7, '17:00'), status: '待付款', owner: '王销售' },
  { id: orderNo(-6, 13), customer: '青岛海纳传媒', amount: 39000, createTime: dayTime(-6, '11:45'), status: '已发货', owner: '王销售' },
  { id: orderNo(-5, 14), customer: '长沙湘江软件', amount: 102000, createTime: dayTime(-5, '13:30'), status: '已完成', owner: '王销售' },
  { id: orderNo(-4, 15), customer: '郑州中原信息', amount: 61000, createTime: dayTime(-4, '10:05'), status: '已付款', owner: '王销售' },
  { id: orderNo(-3, 16), customer: '无锡新元电子', amount: 88000, createTime: dayTime(-3, '15:20'), status: '待付款', owner: '王销售' },
  { id: orderNo(-2, 17), customer: '福州闽江网络', amount: 47000, createTime: dayTime(-2, '09:50'), status: '已发货', owner: '王销售' },
  { id: orderNo(-1, 18), customer: '合肥科创智能', amount: 134000, createTime: dayTime(-1, '14:40'), status: '已完成', owner: '王销售' },
  { id: orderNo(0, 19), customer: '宁波江北实业', amount: 56000, createTime: dayTime(0, '11:10'), status: '已付款', owner: '王销售' },
  { id: orderNo(1, 20), customer: '东莞华翔制造', amount: 176000, createTime: dayTime(1, '16:25'), status: '待付款', owner: '王销售' }
]

// ========================= 7. 项目（含关联任务） =========================
export const projects = [
  { id: 'P-01', name: '企业管理工作台 V2.0', startDate: today(-50), endDate: today(55), progress: 62, risk: '正常', owner: '李经理', taskIds: ['T-1001', 'T-1002', 'T-1007', 'T-1011', 'T-1016'] },
  { id: 'P-02', name: 'CRM 销售一体化', startDate: today(-72), endDate: today(9), progress: 88, risk: '预警', owner: '王销售', taskIds: ['T-1003', 'T-1009', 'T-1014'] },
  { id: 'P-03', name: '财务中台对账系统', startDate: today(-93), endDate: today(20), progress: 74, risk: '正常', owner: '赵财务', taskIds: ['T-1004', 'T-1010', 'T-1015'] },
  { id: 'P-04', name: '数据中台基础建设', startDate: today(-128), endDate: today(-21), progress: 100, risk: '延期', owner: '李经理', taskIds: ['T-1005'] },
  { id: 'P-05', name: '权限与组织架构重构', startDate: today(-20), endDate: today(30), progress: 35, risk: '正常', owner: '张总', taskIds: ['T-1006', 'T-1008'] },
  { id: 'P-06', name: '移动端轻量门户', startDate: today(-41), endDate: today(4), progress: 90, risk: '预警', owner: '李经理', taskIds: ['T-1012', 'T-1013'] },
  { id: 'P-07', name: '智能客服试点', startDate: today(-16), endDate: today(71), progress: 18, risk: '正常', owner: '王销售', taskIds: [] },
  { id: 'P-08', name: 'BI 数据可视化平台', startDate: today(-81), endDate: today(-3), progress: 95, risk: '延期', owner: '赵财务', taskIds: [] }
]

// ========================= 8. 客户（含跟进记录） =========================
export const customers = [
  {
    id: 'C-01', name: '北京云图科技', contact: '刘明', phone: '13800138001', dealStatus: '已成交', nextVisit: today(3),
    followRecords: [
      { time: dayTime(-11, '10:00'), content: '完成合同签署，进入实施阶段' },
      { time: dayTime(-23, '14:00'), content: '演示工作台核心功能，客户认可' }
    ]
  },
  {
    id: 'C-02', name: '上海远景信息', contact: '周婷', phone: '13800138002', dealStatus: '已成交', nextVisit: today(12),
    followRecords: [
      { time: dayTime(-13, '09:30'), content: '二期需求沟通，确定扩容方案' }
    ]
  },
  {
    id: 'C-03', name: '广州海联实业', contact: '黄强', phone: '13800138003', dealStatus: '跟进中', nextVisit: today(0),
    followRecords: [
      { time: dayTime(-6, '16:00'), content: '报价已发送，等待内部审批' },
      { time: dayTime(-19, '11:00'), content: '首次拜访，了解采购预算' }
    ]
  },
  {
    id: 'C-04', name: '深圳锐诚网络', contact: '林晓', phone: '13800138004', dealStatus: '已成交', nextVisit: today(7),
    followRecords: [{ time: dayTime(-16, '15:00'), content: '设备已发货，安排安装' }]
  },
  {
    id: 'C-05', name: '杭州智联软件', contact: '徐磊', phone: '13800138005', dealStatus: '已成交', nextVisit: today(41),
    followRecords: [{ time: dayTime(-15, '10:00'), content: '续约洽谈中' }]
  },
  {
    id: 'C-06', name: '成都天宇通信', contact: '何静', phone: '13800138006', dealStatus: '跟进中', nextVisit: today(2),
    followRecords: [{ time: dayTime(-9, '14:00'), content: '技术方案评审通过' }]
  },
  {
    id: 'C-07', name: '武汉星河数据', contact: '罗斌', phone: '13800138007', dealStatus: '潜在', nextVisit: today(-1),
    followRecords: [{ time: dayTime(-12, '09:00'), content: '获取线索，初步电话沟通' }]
  },
  {
    id: 'C-08', name: '南京博远电子', contact: '钱伟', phone: '13800138008', dealStatus: '已成交', nextVisit: today(15),
    followRecords: [{ time: dayTime(-11, '13:00'), content: '验收完成，回款中' }]
  },
  {
    id: 'C-09', name: '西安宏图医疗', contact: '韩雪', phone: '13800138009', dealStatus: '跟进中', nextVisit: today(5),
    followRecords: [{ time: dayTime(-10, '10:30'), content: '医疗合规要求补充材料' }]
  },
  {
    id: 'C-10', name: '苏州精工制造', contact: '冯刚', phone: '13800138010', dealStatus: '已成交', nextVisit: today(18),
    followRecords: [{ time: dayTime(-9, '11:00'), content: '交付验收，满意度高' }]
  },
  {
    id: 'C-11', name: '重庆联立科技', contact: '邓丽', phone: '13800138011', dealStatus: '潜在', nextVisit: today(1),
    followRecords: [{ time: dayTime(-7, '15:00'), content: '参加行业展会结识' }]
  },
  {
    id: 'C-12', name: '天津华信集团', contact: '曹宇', phone: '13800138012', dealStatus: '跟进中', nextVisit: today(4),
    followRecords: [{ time: dayTime(-6, '09:20'), content: '总部集采流程沟通' }]
  }
]

// ========================= 9. 通知消息 =========================
export const notifications = [
  { id: 'N-01', type: '系统', title: '系统升级完成', content: '工作台 V2.0 已上线，欢迎体验新版首页看板。', time: dayTime(0, '09:00'), read: false, relatedPage: 'dashboard' },
  { id: 'N-02', type: '任务', title: '你有一个新任务', content: '「订单导出功能开发」已分配给你，请于 ' + today(1).slice(5) + ' 前处理。', time: dayTime(-1, '18:30'), read: false, relatedPage: 'task' },
  { id: 'N-03', type: '订单', title: '订单状态更新', content: '订单 ' + orders[3].id + ' 已发货，金额 ¥230,000。', time: dayTime(-1, '16:50'), read: false, relatedPage: 'order' },
  { id: 'N-04', type: '客户', title: '客户回访提醒', content: '客户「广州海联实业」下次回访时间为 ' + today().slice(5) + '，请及时跟进。', time: dayTime(-1, '10:00'), read: true, relatedPage: 'customer' },
  { id: 'N-05', type: '审批', title: '权限申请待审批', content: '王销售申请「项目管理」模块访问权限，请审批。', time: dayTime(-2, '14:20'), read: false, relatedPage: 'permission' },
  { id: 'N-06', type: '任务', title: '任务被驳回', content: '「登录页验证码性能优化」被驳回，请查看修改意见。', time: dayTime(-2, '11:10'), read: true, relatedPage: 'task' },
  { id: 'N-07', type: '项目', title: '项目风险预警', content: '项目「数据中台基础建设」已延期，请关注进度。', time: dayTime(-3, '17:00'), read: false, relatedPage: 'project' },
  { id: 'N-08', type: '系统', title: '每周数据简报', content: '本周新增订单 21 笔，营收环比增长 9.4%。', time: dayTime(-3, '09:00'), read: true, relatedPage: 'dashboard' },
  { id: 'N-09', type: '客户', title: '客户成交', content: '恭喜！客户「苏州精工制造」已成交，金额 ¥72,000。', time: dayTime(-4, '15:30'), read: true, relatedPage: 'customer' },
  { id: 'N-10', type: '订单', title: '待付款提醒', content: '有 5 笔订单处于待付款状态，请催促回款。', time: dayTime(-4, '09:40'), read: false, relatedPage: 'order' }
]

// ========================= 10. 资源中心文档 =========================
export const resources = [
  { id: 'R-01', name: '产品需求说明书 PRD', category: '产品文档', size: '2.4 MB', uploadTime: today(-6), owner: '张总' },
  { id: 'R-02', name: '前端开发规范', category: '技术规范', size: '1.1 MB', uploadTime: today(-7), owner: '陈员工' },
  { id: 'R-03', name: '接口对接文档', category: '技术规范', size: '3.0 MB', uploadTime: today(-9), owner: '陈员工' },
  { id: 'R-04', name: '员工考勤管理制度', category: '管理制度', size: '0.8 MB', uploadTime: today(-11), owner: '张总' },
  { id: 'R-05', name: '新员工入职培训手册', category: '培训材料', size: '5.2 MB', uploadTime: today(-13), owner: '李经理' },
  { id: 'R-06', name: '销售话术与流程', category: '培训材料', size: '1.6 MB', uploadTime: today(-15), owner: '王销售' },
  { id: 'R-07', name: '财务报销流程', category: '管理制度', size: '0.6 MB', uploadTime: today(-16), owner: '赵财务' },
  { id: 'R-08', name: '项目管理方法论', category: '产品文档', size: '2.0 MB', uploadTime: today(-18), owner: '李经理' },
  { id: 'R-09', name: 'UI 组件设计规范', category: '技术规范', size: '4.1 MB', uploadTime: today(-21), owner: '陈员工' },
  { id: 'R-10', name: '年度经营计划模板', category: '管理制度', size: '0.9 MB', uploadTime: today(-23), owner: '张总' }
]

// ========================= 11. 首页最近动态 =========================
export const recentActivities = [
  { id: 'A-01', time: dayTime(0, '09:00'), type: '系统', text: '工作台 V2.0 正式发布上线' },
  { id: 'A-02', time: dayTime(-1, '18:30'), type: '任务', text: '李经理 将「订单导出功能开发」分配给你' },
  { id: 'A-03', time: dayTime(-1, '16:50'), type: '订单', text: '订单 ' + orders[3].id + ' 状态更新为「已发货」' },
  { id: 'A-04', time: dayTime(-2, '14:20'), type: '审批', text: '王销售 提交「项目管理」权限申请' },
  { id: 'A-05', time: dayTime(-3, '17:00'), type: '项目', text: '项目「数据中台基础建设」标记为延期' },
  { id: 'A-06', time: dayTime(-4, '15:30'), type: '客户', text: '客户「苏州精工制造」成交，金额 ¥72,000' }
]

// ========================= 工具：深拷贝（页面编辑数据时避免污染源） =========================
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
