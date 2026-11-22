<script setup>
/**
 * PermissionManager.vue —— 系统权限管理（仅超级管理员可见）
 * 功能：角色权限矩阵 + 员工账号开设/删除。
 */
import { ref, computed, reactive } from 'vue'
import {
  store, canAccess, LOGIN_RULES, openConfirm,
  createAccount, deleteAccount, isBuiltinAccount
} from '../store.js'
import { modules, roles, accounts, demoPasswords, roleLabelMap } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import Icon from '../components/Icon.vue'
import Modal from '../components/Modal.vue'
import Select from '../components/Select.vue'

const toast = useToast()
// 页面级角色校验：仅超级管理员可查看/修改权限，防止绕过菜单直接进入
const isAdmin = computed(() => store.currentUser?.role === 'superadmin' && canAccess('permission'))

// ------------------------- 角色权限矩阵 -------------------------
// 直接编辑共享的 store.roles（响应式），侧边栏会实时反映权限变化；
// 此处演示「本地保存」，真实项目可在此处调用后端接口持久化。
function has(role, key) { return role.modules.includes(key) }
function toggle(role, key) {
  if (!isAdmin.value) return
  const i = role.modules.indexOf(key)
  if (i > -1) role.modules.splice(i, 1)
  else role.modules.push(key)
}
function save() {
  if (!isAdmin.value) { toast.error('无权修改权限配置'); return }
  toast.success('权限配置已保存')
}
// 点击回弹：动画结束移除 is-bounce，连续点击可重复触发
const saveBouncing = ref(false)
function clickSave() {
  saveBouncing.value = false
  requestAnimationFrame(() => { saveBouncing.value = true })
  save()
}

// ------------------------- 员工账号 -------------------------
// accounts 是模块级共享数组：创建/删除后重新取快照即可刷新本页列表；
// 登录校验与登录页「一键填充」读的是同一份数据，无需额外同步。
const accountList = ref([])
function refreshAccounts() {
  accountList.value = accounts.map(a => ({
    username: a.username,
    name: a.name,
    role: a.role,
    password: demoPasswords[a.username] || '—',
    builtin: isBuiltinAccount(a.username)
  }))
}
refreshAccounts()

// 新员工可选角色（不含超级管理员）
const roleOptions = roles
  .filter(r => r.id !== 'superadmin')
  .map(r => ({ label: r.name, value: r.id }))

const createOpen = ref(false)
const showNewPwd = ref(false)
const form = reactive({ username: '', name: '', role: 'employee', password: '' })

// 输入层拦截：与登录页共用 LOGIN_RULES，手动同步覆盖粘贴 / 脚本赋值
function onUsernameInput(e) {
  const cleaned = String(e.target.value || '')
    .replace(LOGIN_RULES.usernameInvalid, '')
    .slice(0, LOGIN_RULES.maxUsername)
  form.username = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function onNameInput(e) {
  const cleaned = String(e.target.value || '').replace(/[<>]/g, '').slice(0, 20)
  form.name = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function onPasswordInput(e) {
  const cleaned = String(e.target.value || '').slice(0, LOGIN_RULES.maxPassword)
  form.password = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function resetForm() {
  form.username = ''
  form.name = ''
  form.role = 'employee'
  form.password = ''
  showNewPwd.value = false
}
function openCreate() {
  if (!isAdmin.value) { toast.error('无权创建账号'); return }
  resetForm()
  createOpen.value = true
}
function closeCreate() { createOpen.value = false }
function submitCreate() {
  const res = createAccount({ username: form.username, name: form.name, role: form.role, password: form.password })
  if (!res.success) { toast.error(res.message); return }
  toast.success(res.message)
  refreshAccounts()
  closeCreate()
}
async function removeAccount(row) {
  const ok = await openConfirm({
    title: '删除账号',
    message: `确定删除「${row.name}（${row.username}）」吗？删除后该账号将无法登录。`,
    confirmText: '删除'
  })
  if (!ok) return
  const res = deleteAccount(row.username)
  if (!res.success) { toast.error(res.message); return }
  toast.success(res.message)
  refreshAccounts()
}
</script>

<template>
  <div class="wb-page">
    <template v-if="isAdmin">
    <div class="wb-page-header">
      <div class="wb-page-title">系统权限管理</div>
      <div class="wb-page-actions">
        <button
          class="wb-btn wb-btn-primary wb-btn-bounce"
          :class="{ 'is-bounce': saveBouncing }"
          @click="clickSave"
          @animationend="saveBouncing = false"
        >保存配置</button>
      </div>
    </div>

    <div class="wb-card">
      <div class="wb-card-title">角色 · 模块访问权限矩阵</div>
      <div class="wb-perm-table-wrap">
        <table class="wb-perm-table">
          <thead>
            <tr>
              <th class="wb-perm-role">角色</th>
              <th v-for="m in modules" :key="m.key" class="wb-perm-mod">
                <Icon :name="m.icon" :size="14" style="margin-right:4px;vertical-align:-2px" />{{ m.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in store.roles" :key="role.id">
              <td class="wb-perm-role">
                <div class="wb-perm-role-name">{{ role.name }}</div>
                <div class="wb-perm-role-desc">{{ role.desc }}</div>
              </td>
              <td v-for="m in modules" :key="m.key" class="wb-perm-cell">
                <input type="checkbox" :checked="has(role, m.key)" @change="toggle(role, m.key)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="wb-perm-tip">提示：勾选即授予该角色对应模块的访问权限，左侧导航会按角色实时过滤。</p>
    </div>

    <!-- 员工账号：开设新员工 / 删除本次新增的账号 -->
    <div class="wb-card wb-acct-card">
      <div class="wb-card-head">
        <div class="wb-card-title">员工账号</div>
        <button class="wb-btn wb-btn-primary wb-btn-sm" @click="openCreate">
          <Icon name="plus" :size="13" /> 新增账号
        </button>
      </div>
      <div class="wb-acct-table-wrap">
        <table class="wb-acct-table">
          <thead>
            <tr>
              <th>登录账号</th>
              <th>姓名</th>
              <th>角色</th>
              <th>初始密码</th>
              <th>来源</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in accountList" :key="row.username">
              <td class="wb-acct-mono">{{ row.username }}</td>
              <td>{{ row.name }}</td>
              <td>{{ roleLabelMap[row.role] }}</td>
              <td class="wb-acct-mono">{{ row.password }}</td>
              <td><span class="wb-acct-tag" :class="{ 'is-new': !row.builtin }">{{ row.builtin ? '内置演示' : '本次新增' }}</span></td>
              <td>
                <button v-if="!row.builtin" class="wb-btn wb-btn-sm wb-btn-danger" @click="removeAccount(row)">删除</button>
                <span v-else class="wb-acct-locked">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="wb-perm-tip">提示：新员工账号仅本次会话有效，刷新页面后重置；创建后可在登录页「演示账号」一键填充直接登录。</p>
    </div>

    <!-- 开设账号弹窗 -->
    <Modal :visible="createOpen" title="开设新员工账号" :width="520" @close="closeCreate">
      <div class="wb-form-item">
        <label class="wb-form-label">登录账号 <span class="req">*</span></label>
        <input
          :value="form.username"
          class="wb-field"
          spellcheck="false"
          placeholder="字母 / 数字 / _ @ . -，最多 11 位"
          :maxlength="LOGIN_RULES.maxUsername"
          @input="onUsernameInput"
        />
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">员工姓名 <span class="req">*</span></label>
        <input
          :value="form.name"
          class="wb-field"
          spellcheck="false"
          placeholder="请输入姓名，最多 20 字"
          maxlength="20"
          @input="onNameInput"
        />
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">所属角色 <span class="req">*</span></label>
        <Select v-model="form.role" :options="roleOptions" />
      </div>
      <div class="wb-form-item">
        <label class="wb-form-label">初始密码 <span class="req">*</span></label>
        <div class="wb-pwd-field">
          <input
            :value="form.password"
            :type="showNewPwd ? 'text' : 'password'"
            class="wb-field"
            spellcheck="false"
            placeholder="请输入 6 位初始密码"
            :maxlength="LOGIN_RULES.maxPassword"
            @input="onPasswordInput"
          />
          <button
            type="button"
            class="wb-pwd-toggle"
            :aria-label="showNewPwd ? '隐藏密码' : '显示密码'"
            :aria-pressed="showNewPwd"
            :title="showNewPwd ? '隐藏密码' : '显示密码'"
            @click="showNewPwd = !showNewPwd"
          >
            <Icon :name="showNewPwd ? 'eye-off' : 'eye'" :size="16" />
          </button>
        </div>
      </div>
      <p class="wb-acct-form-tip">仅超级管理员可开设账号；新员工角色不含超级管理员。演示数据仅本次会话有效，刷新后重置。</p>
      <template #footer>
        <button class="wb-btn wb-btn-default" @click="closeCreate">取消</button>
        <button class="wb-btn wb-btn-primary" @click="submitCreate">确认创建</button>
      </template>
    </Modal>
    </template>

    <!-- 越权访问兜底：非管理员进入本页时只显示无权限提示 -->
    <div v-else class="wb-card wb-no-permission">
      <Icon name="warning" :size="28" />
      <div class="wb-no-permission-title">无权访问</div>
      <p>系统权限管理仅超级管理员可查看与配置，请使用管理员账号登录。</p>
    </div>
  </div>
</template>

<style scoped>
.wb-perm-table-wrap { overflow-x: auto; }
.wb-perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.wb-perm-table th, .wb-perm-table td {
  border: 1px solid #e5e6eb;
  padding: 12px 10px;
  text-align: center;
}
.wb-perm-table thead th {
  background: #f7f8fa;
  color: #4e5969;
  font-weight: 600;
  white-space: nowrap;
}
.wb-perm-role { text-align: left !important; min-width: 200px; background: #fafbfc; }
.wb-perm-role-name { font-weight: 600; color: #1d2129; }
.wb-perm-role-desc { font-size: 12px; color: #86909c; margin-top: 4px; }
.wb-perm-mod { white-space: nowrap; }
.wb-perm-tip { margin-top: 16px; font-size: 12px; color: #86909c; }

/* 员工账号 */
.wb-acct-card { margin-top: 16px; }
.wb-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.wb-acct-table-wrap { overflow-x: auto; }
.wb-acct-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.wb-acct-table th, .wb-acct-table td {
  border: 1px solid #e5e6eb;
  padding: 10px 12px;
  text-align: left;
  white-space: nowrap;
}
.wb-acct-table thead th { background: #f7f8fa; color: #4e5969; font-weight: 600; }
.wb-acct-mono { font-family: Consolas, Monaco, monospace; color: #4e5969; }
.wb-acct-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  background: #f2f3f5;
  color: #86909c;
}
.wb-acct-tag.is-new { background: #e8f3ff; color: #165dff; }
.wb-acct-locked { color: #c9cdd4; }
.wb-acct-form-tip { margin: 4px 0 0; font-size: 12px; color: #86909c; line-height: 1.6; }

/* 无权访问提示 */
.wb-no-permission { text-align: center; padding: 60px 20px; color: #86909c; }
.wb-no-permission-title { margin-top: 12px; font-size: 16px; font-weight: 600; color: #1d2129; }
.wb-no-permission p { margin: 8px 0 0; font-size: 13px; }
</style>
