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
  demoCredential,
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

// ------------------------- 登录 / 登出 -------------------------
export function login(username, password) {
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
  const acc = accounts.find(a => a.username === store.currentUser.username)
  if (!acc || acc.passwordHash !== hashPassword(oldPwd)) {
    return { success: false, message: '当前密码不正确' }
  }
  if (!newPwd || newPwd.length < 6) return { success: false, message: '新密码至少 6 位' }
  if (newPwd !== confirmPwd) return { success: false, message: '两次输入的新密码不一致' }

  // 演示账号共用同一初始密码，统一更新以保持「一键填充」逻辑自洽
  const nextHash = hashPassword(newPwd)
  accounts.forEach(a => { a.passwordHash = nextHash })
  demoCredential.password = newPwd
  return { success: true, message: '密码修改成功（演示环境：本次会话生效，刷新后重置）' }
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
