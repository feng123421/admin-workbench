<script setup>
/**
 * PersonalSettings.vue —— 个人设置
 * 功能：修改密码、工作台个性化配置、消息提醒开关。
 */
import { reactive, computed, ref } from 'vue'
import { store, changePassword, LOGIN_RULES } from '../store.js'
import { modules } from '../mock.js'
import { useToast } from '../composables/useToast.js'
import Select from '../components/Select.vue'
import Icon from '../components/Icon.vue'

const toast = useToast()

// 密码上限与登录页共用同一规则：账号 11 位 / 密码 6 位
const PWD_MAX = LOGIN_RULES.maxPassword
// 三个改密框各自的明文预览开关，互不影响
const showPwd = reactive({ old: false, new: false, confirm: false })

// 修改密码：校验当前密码后真实更新（演示环境本次会话有效）
const pwd = reactive({ old: '', new: '', confirm: '' })
// 与登录页一致：手动同步截断，覆盖原生 maxlength 挡不住的脚本赋值 / 自动填充
function onPwdInput(key, e) {
  const cleaned = String(e.target.value || '').slice(0, PWD_MAX)
  pwd[key] = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function savePwd() {
  const res = changePassword(pwd.old, pwd.new, pwd.confirm)
  if (!res.success) { toast.error(res.message); return }
  toast.success(res.message)
  pwd.old = pwd.new = pwd.confirm = ''
}

// 个性化配置
const personal = reactive({
  landing: store.landing || 'dashboard',
  density: 'standard',
  showWelcome: true
})
// 着陆页选项：仅列出当前角色有权访问的模块，避免跳转到无权页面
const landingOptions = computed(() => {
  const role = store.roles.find(r => r.id === store.currentUser?.role)
  const keys = role ? role.modules : []
  return modules.filter(m => ['dashboard', 'task', 'order', 'project', 'customer'].includes(m.key) && keys.includes(m.key))
})
// 着陆页下拉数据（label/value 格式）
const landingSelectOptions = computed(() => landingOptions.value.map(m => ({ label: m.label, value: m.key })))

// 消息提醒
const remind = reactive({
  site: true,
  email: false,
  sound: false
})

function saveAll() {
  // 保存默认着陆页（下次登录生效）
  store.landing = personal.landing
  toast.success('个人设置已保存')
}

// 点击回弹：给按钮打上 is-bounce，动画结束后由 @animationend 复位，连续点击可重复触发
function bounce(bouncingRef) {
  bouncingRef.value = false
  requestAnimationFrame(() => { bouncingRef.value = true })
}

const saveBouncing = ref(false)
function clickSave() { bounce(saveBouncing); saveAll() }

const pwdBouncing = ref(false)
function clickPwd() { bounce(pwdBouncing); savePwd() }
</script>

<template>
  <div class="wb-page">
    <div class="wb-page-header">
      <div class="wb-page-title">个人设置</div>
      <div class="wb-page-actions">
        <button
          class="wb-btn wb-btn-primary wb-btn-bounce"
          :class="{ 'is-bounce': saveBouncing }"
          @click="clickSave"
          @animationend="saveBouncing = false"
        >保存设置</button>
      </div>
    </div>

    <div class="wb-settings">
      <!-- 账户安全 -->
      <div class="wb-card">
        <div class="wb-card-title">账户安全 · 修改密码</div>
        <div class="wb-settings-form">
          <div class="wb-form-item">
            <label class="wb-form-label">当前密码</label>
            <div class="wb-pwd-field">
              <input :value="pwd.old" :type="showPwd.old ? 'text' : 'password'" class="wb-field" :maxlength="PWD_MAX" autocomplete="off" spellcheck="false" placeholder="请输入当前密码" @input="onPwdInput('old', $event)" />
              <button type="button" class="wb-pwd-toggle" :aria-label="showPwd.old ? '隐藏当前密码' : '显示当前密码'" :aria-pressed="showPwd.old" :title="showPwd.old ? '隐藏当前密码' : '显示当前密码'" @click="showPwd.old = !showPwd.old">
                <Icon :name="showPwd.old ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
          </div>
          <div class="wb-form-item">
            <label class="wb-form-label">新密码</label>
            <div class="wb-pwd-field">
              <input :value="pwd.new" :type="showPwd.new ? 'text' : 'password'" class="wb-field" :maxlength="PWD_MAX" autocomplete="new-password" spellcheck="false" placeholder="请输入 6 位新密码" @input="onPwdInput('new', $event)" />
              <button type="button" class="wb-pwd-toggle" :aria-label="showPwd.new ? '隐藏新密码' : '显示新密码'" :aria-pressed="showPwd.new" :title="showPwd.new ? '隐藏新密码' : '显示新密码'" @click="showPwd.new = !showPwd.new">
                <Icon :name="showPwd.new ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
          </div>
          <div class="wb-form-item">
            <label class="wb-form-label">确认新密码</label>
            <div class="wb-pwd-field">
              <input :value="pwd.confirm" :type="showPwd.confirm ? 'text' : 'password'" class="wb-field" :maxlength="PWD_MAX" autocomplete="new-password" spellcheck="false" placeholder="再次输入 6 位新密码" @input="onPwdInput('confirm', $event)" />
              <button type="button" class="wb-pwd-toggle" :aria-label="showPwd.confirm ? '隐藏确认密码' : '显示确认密码'" :aria-pressed="showPwd.confirm" :title="showPwd.confirm ? '隐藏确认密码' : '显示确认密码'" @click="showPwd.confirm = !showPwd.confirm">
                <Icon :name="showPwd.confirm ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
          </div>
          <p class="wb-pwd-tip">演示环境：校验当前密码后生效，仅本次会话有效，刷新页面将重置为初始密码。</p>
          <button
            class="wb-btn wb-btn-primary pwd-btn wb-btn-bounce"
            :class="{ 'is-bounce': pwdBouncing }"
            @click="clickPwd"
            @animationend="pwdBouncing = false"
          >修改密码</button>
        </div>
      </div>

      <!-- 工作台个性化 -->
      <div class="wb-card">
        <div class="wb-card-title">工作台个性化配置</div>
        <div class="wb-settings-form">
          <div class="wb-form-item">
            <label class="wb-form-label">默认着陆页</label>
            <Select v-model="personal.landing" :options="landingSelectOptions" />
          </div>
          <div class="wb-form-item">
            <label class="wb-form-label">界面密度</label>
            <Select v-model="personal.density" :options="[{ label: '标准', value: 'standard' }, { label: '紧凑', value: 'compact' }]" />
          </div>
          <div class="wb-form-row-line">
            <span>显示首页欢迎语</span>
            <label class="wb-switch">
              <input type="checkbox" v-model="personal.showWelcome" />
              <span class="wb-switch-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 消息提醒 -->
      <div class="wb-card">
        <div class="wb-card-title">消息提醒</div>
        <div class="wb-settings-form">
          <div class="wb-form-row-line">
            <span>站内消息提醒</span>
            <label class="wb-switch">
              <input type="checkbox" v-model="remind.site" />
              <span class="wb-switch-slider"></span>
            </label>
          </div>
          <div class="wb-form-row-line">
            <span>邮件提醒</span>
            <label class="wb-switch">
              <input type="checkbox" v-model="remind.email" />
              <span class="wb-switch-slider"></span>
            </label>
          </div>
          <div class="wb-form-row-line">
            <span>声音提醒</span>
            <label class="wb-switch">
              <input type="checkbox" v-model="remind.sound" />
              <span class="wb-switch-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wb-settings { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.wb-settings-form { display: flex; flex-direction: column; max-width: 360px; }
.wb-form-row-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;
  font-size: 13px;
  color: #1d2129;
}
/* 开关 */
.wb-switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.wb-switch input { opacity: 0; width: 0; height: 0; }
.wb-switch-slider {
  position: absolute; cursor: pointer; inset: 0;
  background: #c9cdd4; border-radius: 24px; transition: 0.2s;
}
.wb-switch-slider::before {
  content: ''; position: absolute; height: 18px; width: 18px;
  left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s;
}
.wb-switch input:checked + .wb-switch-slider { background: #165dff; }
.wb-switch input:checked + .wb-switch-slider::before { transform: translateX(18px); }
/* 「修改密码」按钮：与「保存设置」同尺寸（自适应宽度，不被表单拉伸） */
.pwd-btn { align-self: flex-start; }
.wb-pwd-tip { margin: 0 0 12px; font-size: 12px; color: #86909c; line-height: 1.6; }
@media (max-width: 1100px) { .wb-settings { grid-template-columns: 1fr; } }
</style>
