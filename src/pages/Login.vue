<script setup>
/**
 * Login.vue —— 登录页面
 * 账号密码登录，区分角色；提供演示账号一键填充。
 */
import { ref, reactive } from 'vue'
import { login, LOGIN_RULES } from '../store.js'
import { accounts, roleLabelMap, demoCredential, demoPasswords } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import Icon from '../components/Icon.vue'

const toast = useToast()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
// 密码明文预览：登录组件每次挂载默认关闭，登出后不会残留明文状态
const showPassword = ref(false)

// 输入拦截规则：长度上限 + 账号字符白名单
// 说明：账号仅用于与本地账号表精确匹配，不含中文/特殊符号，可安全收紧；
// 密码只限制长度，不限制字符，避免影响「修改密码」等正常场景。
const MAX_USERNAME = LOGIN_RULES.maxUsername
const MAX_PASSWORD = LOGIN_RULES.maxPassword
const USERNAME_INVALID = LOGIN_RULES.usernameInvalid
const USERNAME_PATTERN = LOGIN_RULES.usernamePattern

// 账号用 :value + @input 手动同步，保证粘贴 / 拖拽 / 输入法带入的非法字符
// 在写进状态之前就被清掉（原生 maxlength 负责长度上限）
function onUsernameInput(e) {
  const cleaned = String(e.target.value || '').replace(USERNAME_INVALID, '').slice(0, MAX_USERNAME)
  form.username = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}

// 密码不限制字符，但同样在写进状态前截断长度；
// 原生 maxlength 只约束键盘/粘贴，手动同步可覆盖脚本赋值、自动填充等路径
function onPasswordInput(e) {
  const cleaned = String(e.target.value || '').slice(0, MAX_PASSWORD)
  form.password = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}

// 演示账号一键填充：按账号取各自的当前演示密码（改密只影响该账号）
function fill(acc) {
  form.username = acc.username
  form.password = demoPasswords[acc.username] || ''
}

function onSubmit() {
  // 防重复提交：模拟延迟期间按钮 disabled，但回车等方式仍可能触发 submit
  if (loading.value) return

  const username = form.username.trim()
  const password = form.password
  form.username = username
  if (!username || !password) {
    toast.error('请输入账号和密码')
    return
  }
  // 提交层兜底校验：即使绕过界面直接构造数据，也不会进入摘要计算
  if (username.length > MAX_USERNAME || password.length > MAX_PASSWORD) {
    toast.error(`账号最多 ${MAX_USERNAME} 位、密码最多 ${MAX_PASSWORD} 位`)
    return
  }
  if (!USERNAME_PATTERN.test(username)) {
    toast.error('账号仅支持字母、数字、_、@、.、-')
    return
  }

  loading.value = true
  // 模拟网络延迟
  setTimeout(() => {
    const res = login(username, password)
    loading.value = false
    if (!res.success) {
      toast.error(res.message)
    } else {
      toast.success('登录成功，欢迎回来')
    }
  }, 400)
}
</script>

<template>
  <div class="wb-login">
    <div class="wb-login-card">
      <div class="wb-login-brand">
        <span class="wb-login-mark">W</span>
        <h1>企业管理工作台</h1>
        <p>中小团队内部协作与管理平台</p>
      </div>

      <form class="wb-login-form" @submit.prevent="onSubmit">
        <div class="wb-form-item">
          <label class="wb-form-label">账号</label>
          <input
            :value="form.username"
            class="wb-field"
            placeholder="请输入账号"
            autocomplete="username"
            spellcheck="false"
            :maxlength="MAX_USERNAME"
            @input="onUsernameInput"
          />
        </div>
        <div class="wb-form-item">
          <label class="wb-form-label">密码</label>
          <div class="wb-pwd-field">
            <input
              :value="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="wb-field"
              placeholder="请输入密码"
              autocomplete="current-password"
              spellcheck="false"
              :maxlength="MAX_PASSWORD"
              @input="onPasswordInput"
            />
            <button
              type="button"
              class="wb-pwd-toggle"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              :aria-pressed="showPassword"
              :title="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <Icon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
            </button>
          </div>
        </div>
        <button type="submit" class="wb-btn wb-btn-primary wb-login-submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </form>

      <div class="wb-login-demo">
        <div class="wb-login-demo-title">演示账号（初始密码 {{ demoCredential.password }}，点击自动填入）</div>
        <div class="wb-login-demo-list">
          <button
            v-for="acc in accounts"
            :key="acc.username"
            class="wb-demo-chip"
            :title="roleLabelMap[acc.role] + ' · ' + acc.username"
            @click="fill(acc)"
          >
            <Icon name="user" :size="13" />
            {{ acc.name }}
          </button>
        </div>
        <p class="wb-login-secure-tip">前端模拟鉴权，仅用于功能演示，请勿用于生产环境</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wb-login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef3ff 0%, #f5f6f8 60%);
}
.wb-login-card {
  width: 400px;
  max-width: 92vw;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 14px;
  padding: 36px 32px;
  box-shadow: 0 10px 40px rgba(22, 93, 255, 0.08);
}
.wb-login-brand { text-align: center; margin-bottom: 28px; }
.wb-login-mark {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #165dff;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.wb-login-brand h1 { font-size: 20px; margin: 0 0 6px; color: #1d2129; }
.wb-login-brand p { font-size: 13px; color: #86909c; margin: 0; }
.wb-login-form { display: flex; flex-direction: column; }
.wb-login-submit { height: 40px; justify-content: center; font-size: 15px; margin-top: 4px; }
.wb-login-demo { margin-top: 24px; border-top: 1px dashed #e5e6eb; padding-top: 16px; }
.wb-login-demo-title { font-size: 12px; color: #86909c; margin-bottom: 10px; }
.wb-login-demo-list { display: flex; flex-wrap: wrap; gap: 8px; }
.wb-demo-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 5px 10px;
  border: 1px solid #e5e6eb;
  border-radius: 20px;
  background: #fff;
  color: #4e5969;
  cursor: pointer;
}
.wb-demo-chip:hover { border-color: #165dff; color: #165dff; }
/* 演示环境安全提示：明确前端模拟鉴权的定位 */
.wb-login-secure-tip { margin: 12px 0 0; font-size: 11px; color: #86909c; text-align: center; }
</style>
