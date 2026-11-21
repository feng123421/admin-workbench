<script setup>
/**
 * Login.vue —— 登录页面
 * 账号密码登录，区分角色；提供演示账号一键填充。
 */
import { ref, reactive } from 'vue'
import { login } from '../store.js'
import { accounts, roleLabelMap, demoCredential } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import Icon from '../components/Icon.vue'

const toast = useToast()
const form = reactive({ username: '', password: '' })
const loading = ref(false)

// 演示账号一键填充（使用共享的演示凭据，改密后自动同步）
function fill(acc) {
  form.username = acc.username
  form.password = demoCredential.password
}

function onSubmit() {
  if (!form.username || !form.password) {
    toast.error('请输入账号和密码')
    return
  }
  loading.value = true
  // 模拟网络延迟
  setTimeout(() => {
    const res = login(form.username, form.password)
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
          <input v-model="form.username" class="wb-field" placeholder="请输入账号" autocomplete="username" />
        </div>
        <div class="wb-form-item">
          <label class="wb-form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="wb-field"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>
        <button type="submit" class="wb-btn wb-btn-primary wb-login-submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </form>

      <div class="wb-login-demo">
        <div class="wb-login-demo-title">演示账号（统一密码：{{ demoCredential.password }}）</div>
        <div class="wb-login-demo-list">
          <button
            v-for="acc in accounts"
            :key="acc.username"
            class="wb-demo-chip"
            @click="fill(acc)"
          >
            <Icon name="user" :size="13" />
            {{ roleLabelMap[acc.role] }}
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
