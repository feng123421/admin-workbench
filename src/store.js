/**
 * store.js —— 轻量级全局状态（基于 Vue reactive）
 * ------------------------------------------------------------------
 * 注意：本项目禁止使用 pinia / vuex，这里仅用一个 reactive 对象 + 函数
 * 来实现「登录状态、当前页面、通知、Toast、确认框」的共享，属于原生方案。
 *
 * 安全加固（2026-11-10）：
 *  1. 登录改为摘要比较，前端不再保存 / 比较明文密码；
 *  2. 会话写入 localStorage 时附加签名，读取时校验，防止手改 role 提权；
 *  3. navigate 增加角色权限守卫，越权跳转一律回退首页；
 *  4. canAccess 供 App.vue / 各页面复用作统一权限判定；
 *  5. changePassword 让「修改密码」真实生效（演示环境本次会话有效）。
 */
import { reactive } from 'vue'
import {
  accounts,
  notifications as mockNotifications,
  roles as mockRoles,
  hashPassword,
  demoPasswords,
  deepClone
} from './mock.js'

// 本地存储 key（用于刷新后保持登录态）
const STORAGE_KEY = 'admin_workbench_user'
// 演示用签名盐。注意：前端密钥必然可被读取，签名仅用于阻止「随手改 localStorage 提权」，
// 不能替代服务端会话校验；生产必须由服务端签发并验证会话。
const SESSION_SALT = 'wb-workbench-session-v1'

// 会话签名：绑定 username / name / role，任一字段被改动都会导致校验失败
function signSession(user) {
  return hashPassword(`${SESSION_SALT}|${user.username}|${user.name}|${user.role}`)
}

// 校验本地会话：结构合法 + 角色合法 + 签名匹配，避免信任被篡改的数据
function isValidSession(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.username !== 'string' || typeof obj.name !== 'string') return false
  if (!mockRoles.some(r => r.id === obj.role)) return false
  return typeof obj.sig === 'string' && obj.sig === signSession(obj)
}

// 读取浏览器中已保存的登录用户；校验不通过直接清除，退回登录页
function loadSavedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const user = JSON.parse(raw)
    if (!isValidSession(user)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    // 签名不进入响应式状态
    const { sig, ...safe } = user
    return safe
  } catch (e) {
    return null
  }
}

function persistSession(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...user, sig: signSession(user) }))
  } catch (e) { /* 忽略存储异常 */ }
}

// 响应式全局状态
export const store = reactive({
  // 当前登录用户：{ username, name, role } 或 null
  currentUser: loadSavedUser(),
  // 当前显示的页面 key（原生组件切换，不依赖 vue-router）
  currentPage: 'dashboard',
  // 角色与权限（可编辑副本；权限管理页与侧边栏共用，保证修改实时生效）
  roles: deepClone(mockRoles),
  // 个人设置：默认着陆页
  landing: 'dashboard',
  // 通知列表（从 mock 拷贝，便于标记已读）
  notifications: deepClone(mockNotifications),
  // Toast 列表
  toasts: [],
  // 全局确认框状态
  confirm: {
    open: false,
    title: '',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    resolve: null // Promise 的 resolve 回调
  }
})

// ------------------------- 权限判定 -------------------------
/** 当前登录角色是否有权访问指定页面 key */
export function canAccess(page) {
  if (!store.currentUser) return false
  const role = store.roles.find(r => r.id === store.currentUser.role)
  return !!role && role.modules.includes(page)
}

// ------------------------- 登录输入规则（界面与鉴权层共用） -------------------------
// 单一来源：Login.vue 用它做输入拦截，login() 用它做提交兜底，避免规则不一致
// 演示约定：账号最多 11 位、密码最多 6 位（初始演示密码 123456 正好 6 位）
export const LOGIN_RULES = {
  maxUsername: 11,
  maxPassword: 6,
  usernamePattern: /^[A-Za-z0-9_@.-]+$/,
  usernameInvalid: /[^A-Za-z0-9_@.-]/g
}

// ------------------------- 登录 / 登出 -------------------------
export function login(username, password) {
  // 入参校验（防御纵深）：绕过界面直接调用 login() 时同样受限，
  // 同时避免超长字符串进入 hashPassword 的同步循环导致主线程卡顿
  if (
    typeof username !== 'string' || typeof password !== 'string' ||
    !username || !password ||
    username.length > LOGIN_RULES.maxUsername ||
    password.length > LOGIN_RULES.maxPassword ||
    !LOGIN_RULES.usernamePattern.test(username)
  ) {
    return { success: false, message: '账号或密码格式不正确' }
  }

  // 摘要比较：前端不保存、不比较明文密码
  const acc = accounts.find(a => a.username === username && a.passwordHash === hashPassword(password))
  if (!acc) return { success: false, message: '账号或密码错误' }

  const user = { username: acc.username, name: acc.name, role: acc.role }
  store.currentUser = user
  persistSession(user)
  // 着陆页必须落在当前角色可访问范围内，防止权限变更后越权落地
  store.currentPage = canAccess(store.landing || 'dashboard') ? store.landing : 'dashboard'
  return { success: true }
}

export function logout() {
  store.currentUser = null
  store.currentPage = 'dashboard'
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) { /* 忽略 */ }
}

export function isLoggedIn() {
  return !!store.currentUser
}

/** 修改密码：校验旧密码后真实更新（演示环境本次会话有效，刷新后重置） */
export function changePassword(oldPwd, newPwd, confirmPwd) {
  if (!store.currentUser) return { success: false, message: '登录状态已失效，请重新登录' }
  if (
    typeof oldPwd !== 'string' || typeof newPwd !== 'string' || typeof confirmPwd !== 'string' ||
    [oldPwd, newPwd, confirmPwd].some(p => p.length > LOGIN_RULES.maxPassword)
  ) {
    return { success: false, message: '密码长度不能超过 6 位' }
  }
  const acc = accounts.find(a => a.username === store.currentUser.username)
  if (!acc || acc.passwordHash !== hashPassword(oldPwd)) {
    return { success: false, message: '当前密码不正确' }
  }
  // 上限与下限都为 6，因此新密码必须恰好 6 位
  if (!newPwd || newPwd.length < LOGIN_RULES.maxPassword) {
    return { success: false, message: '新密码需为 6 位' }
  }
  if (newPwd !== confirmPwd) return { success: false, message: '两次输入的新密码不一致' }

  // 只更新当前登录账号：其他角色的密码不受影响
  // demoPasswords 同步该账号的演示密码，保证登录页「一键填充」仍能填对
  acc.passwordHash = hashPassword(newPwd)
  demoPasswords[acc.username] = newPwd
  return { success: true, message: '密码修改成功（演示环境：本次会话生效，刷新后重置）' }
}

// ------------------------- 员工账号管理（仅超级管理员） -------------------------
// 模块加载时快照内置演示账号，保护演示基线不被删除
const builtinUsernames = new Set(accounts.map(a => a.username))

/** 是否为内置演示账号（页面据此决定是否展示删除按钮） */
export function isBuiltinAccount(username) {
  return builtinUsernames.has(username)
}

/**
 * 开设新员工账号：校验通过后写入共享账号表，登录校验与登录页「一键填充」立即可用。
 * 演示环境为纯前端内存数据，刷新页面后重置。
 */
export function createAccount({ username, name, role, password } = {}) {
  if (store.currentUser?.role !== 'superadmin' || !canAccess('permission')) {
    return { success: false, message: '无权创建账号，请使用超级管理员登录' }
  }
  const u = typeof username === 'string' ? username.trim() : ''
  const n = typeof name === 'string' ? name.trim() : ''
  const r = typeof role === 'string' ? role : ''
  const p = typeof password === 'string' ? password : ''
  if (!u || u.length > LOGIN_RULES.maxUsername || !LOGIN_RULES.usernamePattern.test(u)) {
    return { success: false, message: '账号需为 11 位以内的字母、数字、_、@、.、-，且不能为空' }
  }
  if (accounts.some(a => a.username === u)) return { success: false, message: '该账号已存在' }
  if (!n || n.length > 20 || /[<>]/.test(n)) {
    return { success: false, message: '姓名需为 1~20 个字符，且不能包含尖括号' }
  }
  // 新员工不允许直接授予超级管理员，避免开出可配置权限的账号
  if (r === 'superadmin' || !mockRoles.some(x => x.id === r)) {
    return { success: false, message: '请选择一个有效的员工角色' }
  }
  if (p.length !== LOGIN_RULES.maxPassword) {
    return { success: false, message: '初始密码需为 6 位' }
  }
  accounts.push({ username: u, passwordHash: hashPassword(p), name: n, role: r })
  demoPasswords[u] = p
  return { success: true, message: `账号「${u}」创建成功`, account: { username: u, name: n, role: r } }
}

/** 删除账号：内置演示账号与当前登录账号不可删除 */
export function deleteAccount(username) {
  if (store.currentUser?.role !== 'superadmin' || !canAccess('permission')) {
    return { success: false, message: '无权删除账号' }
  }
  const i = accounts.findIndex(a => a.username === username)
  if (i < 0) return { success: false, message: '账号不存在' }
  if (builtinUsernames.has(username)) return { success: false, message: '内置演示账号不可删除' }
  if (store.currentUser?.username === username) return { success: false, message: '不能删除当前登录账号' }
  accounts.splice(i, 1)
  delete demoPasswords[username]
  return { success: true, message: `账号「${username}」已删除` }
}

// ------------------------- 页面切换（带权限守卫） -------------------------
export function navigate(page) {
  if (!canAccess(page)) {
    // 越权跳转一律回退首页（直接赋值，不再经过守卫，避免递归）
    store.currentPage = 'dashboard'
    return false
  }
  store.currentPage = page
  return true
}

// ------------------------- 通知 -------------------------
export function markNotificationRead(id) {
  const item = store.notifications.find(n => n.id === id)
  if (item) item.read = true
}

export function markAllNotificationsRead() {
  store.notifications.forEach(n => (n.read = true))
}

export function unreadCount() {
  return store.notifications.filter(n => !n.read).length
}

// ------------------------- Toast 提示 -------------------------
let toastId = 0
export function showToast(message, type = 'success', duration = 2500) {
  const id = ++toastId
  store.toasts.push({ id, message, type })
  setTimeout(() => {
    const idx = store.toasts.findIndex(t => t.id === id)
    if (idx > -1) store.toasts.splice(idx, 1)
  }, duration)
}

// ------------------------- 确认框（返回 Promise） -------------------------
export function openConfirm({ title = '确认操作', message = '', confirmText = '确定', cancelText = '取消' } = {}) {
  store.confirm.open = true
  store.confirm.title = title
  store.confirm.message = message
  store.confirm.confirmText = confirmText
  store.confirm.cancelText = cancelText
  return new Promise(resolve => {
    store.confirm.resolve = resolve
  })
}

// 由 ConfirmDialog 组件在用户点击后调用
export function resolveConfirm(result) {
  if (store.confirm.resolve) store.confirm.resolve(result)
  store.confirm.open = false
  store.confirm.resolve = null
}
